const express = require('express');
const Article = require('../models/Article');
const { verifyToken } = require('../middlewares/authMiddleware');
const { updateArticle, deleteArticle, likeArticle, checkUserLike } = require('../controllers/articleController');

const axios = require('axios');

const router = express.Router();

// 📌 Créer un article
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, content, image, tags } = req.body;

        const article = new Article({
            title,
            content,
            image,
            tags,
            author: req.user.id // récupéré a travers verifyToken
        });

        await article.save();
        res.status(201).json(article);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


/**
 *  GET /api/articles
 * Query params :
 *  - search : mot-clé pour chercher dans le titre et le contenu
 *  - tag : filtrer par tag spécifique
 *  - page : numéro de page (par défaut 1)
 *  - limit : nombre d'articles par page (par défaut 10)
 */
router.get('/', verifyToken, async (req, res) => {
//router.get('/', async (req, res) => {
    try {
        const { search, tag, page = 1, limit = 10 } = req.query;

        console.log('🔍 Recherche - Paramètres reçus:', { search, tag, page, limit });

        const filter = {};
        
        
        if (search && search.trim()) {
            const searchTerm = search.trim();
            filter.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { content: { $regex: searchTerm, $options: 'i' } }
            ];
            console.log('🔍 Filtre de recherche appliqué:', filter);
        }
        
        
        if (tag && tag.trim()) {
            filter.tags = { $in: [tag.trim()] };
            console.log('🏷️ Filtre de tag appliqué:', filter);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        console.log('🔍 Filtre final:', filter);

        const articles = await Article.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Article.countDocuments(filter);

        console.log(`📊 Résultats: ${articles.length} articles trouvés sur ${total} total`);

        // 🔹 Récupérer les infos des auteurs depuis UserService
       const articlesWithAuthors = await Promise.all(
    articles.map(async (article) => {
        try {
            console.log("Appel à UserService pour author:", article.author);
            console.log("Authorization Header envoyé :", req.headers.authorization);

            const userRes = await axios.get(
                `http://localhost:5001/api/users/${article.author}`,
                {
                    headers: {
                        Authorization: req.headers.authorization
                    }
                }
            );
            return { ...article.toObject(), authorDetails: userRes.data };
        } catch (err) {
            console.error("Erreur lors de la récupération de l'auteur :", err.message);
            return { ...article.toObject(), authorDetails: null };
        }
    })
);

        res.json({
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            articles: articlesWithAuthors
        });
    } catch (err) {
        console.error('❌ Erreur lors de la recherche:', err);
        res.status(500).json({ message: err.message });
    }
});

// 📌 Vérifier le statut de like d'un utilisateur pour un article
router.get('/:articleId/like', verifyToken, checkUserLike);

// 📌 Liker/unliker un article
router.post('/:articleId/like', verifyToken, likeArticle);

router.delete('/:id', verifyToken, deleteArticle);

router.put('/:id', verifyToken, updateArticle);




module.exports = router;
