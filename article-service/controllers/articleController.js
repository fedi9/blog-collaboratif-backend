const Article = require('../models/Article');
const ArticleStats = require('../models/ArticleStats');

// PUT /api/articles/:id
const updateArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé.' });
        }

        // 🔒 Règles de permission :
        // Admin & Éditeur → peuvent tout modifier
        // Rédacteur → peut modifier uniquement ses propres articles
        if (
            req.user.role === 'Redacteur' &&
            article.author.toString() !== req.user.id
        ) {
            return res.status(403).json({ message: "Vous n'avez pas l'autorisation de modifier cet article." });
        }

        // Mise à jour
        article.title = req.body.title || article.title;
        article.content = req.body.content || article.content;
        article.image = req.body.image || article.image;
        article.tags = req.body.tags || article.tags;

        const updatedArticle = await article.save();
        res.json(updatedArticle);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Liker/unliker un article (toggle par utilisateur)
const likeArticle = async (req, res) => {
    try {
        const { articleId } = req.params;
        const userId = req.user.id; // Utiliser req.user.id au lieu de req.user.userId
        
        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé.' });
        }

        // Vérifier si l'utilisateur a déjà liké cet article
        const userLikedIndex = article.likedBy.indexOf(userId);
        
        if (userLikedIndex > -1) {
            // L'utilisateur a déjà liké → retirer le like
            article.likedBy.splice(userLikedIndex, 1);
            article.likeCount = Math.max(0, article.likeCount - 1);
            await article.save();
            
            // Mettre à jour les statistiques
            let stats = await ArticleStats.findOne({ article: articleId });
            if (stats) {
                await stats.decrementLikes();
            }
            
            res.json({
                message: 'Like retiré avec succès',
                likeCount: article.likeCount,
                userLiked: false,
                article: article
            });
        } else {
            // L'utilisateur n'a pas encore liké → ajouter le like
            article.likedBy.push(userId);
            article.likeCount += 1;
            await article.save();
            
            // Mettre à jour les statistiques
            let stats = await ArticleStats.findOne({ article: articleId });
            if (!stats) {
                stats = new ArticleStats({ article: articleId, totalLikes: 0 });
            }
            await stats.incrementLikes();
            
            res.json({
                message: 'Article liké avec succès',
                likeCount: article.likeCount,
                userLiked: true,
                article: article
            });
        }

    } catch (err) {
        console.error('Error toggling article like:', err);
        res.status(500).json({ message: err.message });
    }
};

// Vérifier si un utilisateur a liké un article
const checkUserLike = async (req, res) => {
    try {
        const { articleId } = req.params;
        const userId = req.user.id; // Utiliser req.user.id au lieu de req.user.userId
        
        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé.' });
        }

        const userLiked = article.likedBy.includes(userId);
        
        res.json({
            userLiked: userLiked,
            likeCount: article.likeCount
        });

    } catch (err) {
        console.error('Error checking user like:', err);
        res.status(500).json({ message: err.message });
    }
};

// 🔹 DELETE /api/articles/:id
const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: "Article non trouvé." });
        }

        // 🔐 Vérification de rôle
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Seul un Admin peut supprimer un article." });
        }

        await article.deleteOne();
        res.json({ message: "Article supprimé avec succès." });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


module.exports = {
    updateArticle,
    deleteArticle,
    likeArticle,
    checkUserLike
};
