const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Routes publiques (pour lire les commentaires)
router.get('/article/:articleId', commentController.getCommentsByArticle);
router.get('/:commentId/replies', commentController.getReplies);

// Routes protégées (nécessitent une authentification)
router.use(verifyToken);

router.post('/', commentController.createComment);
router.put('/:commentId', commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);
router.post('/:commentId/like', commentController.toggleLike);

module.exports = router;

