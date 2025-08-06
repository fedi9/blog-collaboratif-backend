const Article = require('../models/Article');

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
};
