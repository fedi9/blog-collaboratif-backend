const Comment = require('../models/Comment');
const Article = require('../models/Article');

// Obtenir tous les commentaires d'un article
exports.getCommentsByArticle = async (req, res) => {
    try {
        const { articleId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        
        const comments = await Comment.find({
            article: articleId,
            parentComment: null,
            isDeleted: false
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        
        for (let comment of comments) {
            const replies = await Comment.find({
                parentComment: comment._id,
                isDeleted: false
            }).sort({ createdAt: 1 });
            
            comment.replies = replies;
        }

        // Compter le nombre total de commentaires
        const totalComments = await Comment.countDocuments({
            article: articleId,
            parentComment: null,
            isDeleted: false
        });

        res.json({
            comments,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalComments / limit),
            totalComments
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des commentaires' });
    }
};

// Créer un nouveau commentaire
exports.createComment = async (req, res) => {
    try {
        const { articleId, content, parentCommentId } = req.body;
        const userId = req.user.userId;

        
        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        
        const commentData = {
            article: articleId,
            author: userId,
            authorName: req.user.username || req.user.email || 'Utilisateur',
            content: content
        };

        if (parentCommentId) {
            commentData.parentComment = parentCommentId;
        }

        const comment = new Comment(commentData);
        await comment.save();

       
        if (parentCommentId) {
            await Comment.findByIdAndUpdate(parentCommentId, {
                $push: { replies: comment._id }
            });
        }

        
        try {
            const socketService = require('../services/socketService');
            if (socketService.io) {
                socketService.io.to(`article_${articleId}`).emit('comment_added', {
                    comment: comment,
                    type: parentCommentId ? 'reply' : 'comment'
                });

                
                if (article.author.toString() !== userId) {
                    socketService.sendNotificationToUser(article.author.toString(), {
                        type: 'new_comment',
                        title: 'Nouveau commentaire',
                        message: `${req.user.username} a commenté votre article "${article.title}"`,
                        articleId: articleId,
                        commentId: comment._id
                    });
                }
            }
        } catch (socketError) {
            console.log('Socket.io service not available:', socketError.message);
        }

        res.status(201).json({
            message: 'Commentaire créé avec succès',
            comment: comment
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Erreur lors de la création du commentaire' });
    }
};

// Mettre à jour un commentaire
exports.updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }

        
        if (comment.author.toString() !== userId) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce commentaire' });
        }

        comment.content = content;
        comment.isEdited = true;
        comment.editedAt = new Date();
        await comment.save();

        res.json({
            message: 'Commentaire mis à jour avec succès',
            comment: comment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du commentaire' });
    }
};

// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }

        
        if (comment.author.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce commentaire' });
        }

    
        comment.isDeleted = true;
        await comment.save();

        res.json({ message: 'Commentaire supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du commentaire' });
    }
};

// Liker/unliker un commentaire
exports.toggleLike = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }

        const likeIndex = comment.likes.indexOf(userId);
        if (likeIndex > -1) {
            // Retirer le like
            comment.likes.splice(likeIndex, 1);
        } else {
            // Ajouter le like
            comment.likes.push(userId);
        }

        await comment.save();

        res.json({
            message: likeIndex > -1 ? 'Like retiré' : 'Commentaire liké',
            comment: comment,
            userLiked: likeIndex === -1
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: 'Erreur lors du like/unlike' });
    }
};

// Obtenir les réponses d'un commentaire
exports.getReplies = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const replies = await Comment.find({
            parentComment: commentId,
            isDeleted: false
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

        const totalReplies = await Comment.countDocuments({
            parentComment: commentId,
            isDeleted: false
        });

        res.json({
            replies,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalReplies / limit),
            totalReplies
        });
    } catch (error) {
        console.error('Error fetching replies:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des réponses' });
    }
}; 