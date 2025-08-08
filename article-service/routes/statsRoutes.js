const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
    getArticleStats,
    getGlobalStats,
    cleanOrphanedStats
} = require('../controllers/statsController');

const router = express.Router();

// Routes protégées (nécessitent une authentification)
router.use(verifyToken);

// Obtenir les statistiques de likes d'un article spécifique
router.get('/article/:articleId', getArticleStats);

// Obtenir les statistiques globales de likes (Admin seulement)
router.get('/global', getGlobalStats);

// Nettoyer les statistiques orphelines (Admin seulement)
router.post('/clean-orphaned', cleanOrphanedStats);

module.exports = router; 