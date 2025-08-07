const express = require('express');
const Article = require('../models/Article');
const { verifyToken } = require('../middlewares/authMiddleware');
const { updateArticle } = require('../controllers/articleController');
const { deleteArticle } = require('../controllers/articleController');

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
            author: req.user.id // récupéré via verifyToken
        });

        await article.save();
        res.status(201).json(article);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


/**
 * 📌 GET /api/articles
 * Query params :
 *  - search : mot-clé pour chercher dans le titre
 *  - tag : filtrer par tag spécifique
 *  - page : numéro de page (par défaut 1)
 *  - limit : nombre d’articles par page (par défaut 10)
 */
router.get('/', verifyToken, async (req, res) => {
//router.get('/', async (req, res) => {
    try {
        const { search, tag, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (search) {
            filter.$text = { $search: search };
        }
        if (tag) {
            filter.tags = tag;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const articles = await Article.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Article.countDocuments(filter);

        // 🔹 Récupérer les infos des auteurs depuis UserService
       const articlesWithAuthors = await Promise.all(
    articles.map(async (article) => {
        try {
            console.log("Appel à UserService pour author:", article.author);
            console.log("Authorization Header envoyé :", req.headers.authorization);

            const userRes = await axios.get(
                `http://localhost:5000/api/users/${article.author}`,
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
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', verifyToken, deleteArticle);

router.put('/:id', verifyToken, updateArticle);




module.exports = router;
