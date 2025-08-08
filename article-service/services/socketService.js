const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Comment = require('../models/Comment');
const Article = require('../models/Article');
const pushNotificationService = require('./pushNotificationService');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
    }

    initialize(server) {
        this.io = socketIo(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:4200",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // Middleware d'authentification
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
                console.log('Token received:', token ? 'Token present' : 'No token');
                
                if (!token) {
                    return next(new Error('Authentication error: Token required'));
                }
                
                const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
                console.log('Decoded token:', decoded);
                
                // Utiliser les bonnes propriétés du token
                socket.userId = decoded.id || decoded.userId;
                socket.userRole = decoded.role;
                socket.username = decoded.username || decoded.email || 'User';
                
                console.log('Socket user set:', {
                    userId: socket.userId,
                    username: socket.username,
                    role: socket.userRole
                });
                
                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.username} (${socket.userId})`);
            
            // Stocker l'utilisateur connecté
            this.connectedUsers.set(socket.userId, {
                socketId: socket.id,
                username: socket.username,
                role: socket.userRole
            });

            // Rejoindre la room de l'utilisateur
            socket.join(`user_${socket.userId}`);

            // Écouter les événements de commentaires
            socket.on('join_article', (articleId) => {
                socket.join(`article_${articleId}`);
                console.log(`User ${socket.username} joined article ${articleId}`);
            });

            socket.on('leave_article', (articleId) => {
                socket.leave(`article_${articleId}`);
                console.log(`User ${socket.username} left article ${articleId}`);
            });

            socket.on('new_comment', async (data) => {
                try {
                    const { articleId, content, parentCommentId } = data;
                    
                    console.log('Socket user info:', {
                        userId: socket.userId,
                        username: socket.username,
                        userRole: socket.userRole
                    });
                    
                    // Vérifier que l'utilisateur est authentifié
                    if (!socket.userId) {
                        throw new Error('User not authenticated');
                    }
                    
                    // Créer le commentaire
                    const newCommentData = {
                        article: articleId,
                        author: socket.userId,
                        authorName: socket.username, // Ajouter le nom d'utilisateur
                        content: content
                    };

                    console.log('Comment data:', newCommentData);

                    if (parentCommentId) {
                        newCommentData.parentComment = parentCommentId;
                    }

                    const comment = new Comment(newCommentData);
                    await comment.save();

                    // Ne pas utiliser populate pour l'auteur car le modèle User n'est pas disponible
                    // await comment.populate('author', 'username email');
                    
                    // Si c'est une réponse, ajouter à la liste des réponses du commentaire parent
                    if (parentCommentId) {
                        await Comment.findByIdAndUpdate(parentCommentId, {
                            $push: { replies: comment._id }
                        });
                    }

                    // Émettre le nouveau commentaire à tous les utilisateurs de l'article
                    console.log('Emitting comment_added event to article room:', `article_${articleId}`);
                    console.log('Comment data being emitted:', comment);
                    
                    // Préparer le commentaire avec toutes les informations nécessaires
                    const commentData = {
                        _id: comment._id,
                        article: comment.article,
                        author: {
                            _id: socket.userId,
                            username: socket.username,
                            email: socket.username // Fallback
                        },
                        authorName: socket.username,
                        content: comment.content,
                        parentComment: comment.parentComment,
                        replies: comment.replies || [],
                        likes: comment.likes || [],
                        isEdited: comment.isEdited || false,
                        editedAt: comment.editedAt,
                        isDeleted: comment.isDeleted || false,
                        createdAt: comment.createdAt,
                        updatedAt: comment.updatedAt
                    };
                    
                    this.io.to(`article_${articleId}`).emit('comment_added', {
                        comment: commentData,
                        type: parentCommentId ? 'reply' : 'comment'
                    });

                    // Notifier l'auteur de l'article si ce n'est pas lui qui commente
                    const article = await Article.findById(articleId);
                    if (article && article.author.toString() !== socket.userId) {
                        await this.sendNotificationToUser(article.author.toString(), {
                            type: 'new_comment',
                            title: 'Nouveau commentaire',
                            message: `${socket.username} a commenté votre article "${article.title}"`,
                            articleId: articleId,
                            commentId: comment._id
                        });
                    }

                } catch (error) {
                    console.error('Error creating comment:', error);
                    socket.emit('comment_error', { message: 'Erreur lors de la création du commentaire' });
                }
            });

            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.username} (${socket.userId})`);
                this.connectedUsers.delete(socket.userId);
            });
        });
    }

    // Méthode pour envoyer une notification à un utilisateur spécifique
    async sendNotificationToUser(userId, notification) {
        // Notification via Socket.io (temps réel)
        const user = this.connectedUsers.get(userId);
        if (user) {
            this.io.to(user.socketId).emit('notification', notification);
        }

        // Notification push (Web Push API)
        try {
            await pushNotificationService.sendNotificationToUser(userId, notification);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification push:', error);
        }
    }

    // Méthode pour envoyer une notification à tous les utilisateurs d'un article
    sendNotificationToArticle(articleId, notification) {
        this.io.to(`article_${articleId}`).emit('notification', notification);
    }

    // Méthode pour obtenir la liste des utilisateurs connectés
    getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }

    // Méthode pour vérifier si un utilisateur est connecté
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }
}

module.exports = new SocketService(); 