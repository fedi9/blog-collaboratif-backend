const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
    getArticleStats,
    getGlobalStats
} = require('../controllers/statsController');

const router = express.Router();

// Routes protégées (nécessitent une authentification)
router.use(verifyToken);

// Obtenir les statistiques de likes d'un article spécifique
router.get('/article/:articleId', getArticleStats);

// Obtenir les statistiques globales de likes (Admin seulement)
router.get('/global', getGlobalStats);

module.exports = router; 