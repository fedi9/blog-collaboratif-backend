const express = require('express');
const router = express.Router();
const pushNotificationController = require('../controllers/pushNotificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route publique pour obtenir la clé VAPID
router.get('/vapid-public-key', pushNotificationController.getVapidPublicKey);

// Routes protégées nécessitant une authentification
router.post('/subscribe', verifyToken, pushNotificationController.subscribe);
router.post('/unsubscribe', verifyToken, pushNotificationController.unsubscribe);
router.get('/subscriptions', verifyToken, pushNotificationController.getUserSubscriptions);
router.delete('/subscriptions/:subscriptionId', verifyToken, pushNotificationController.deleteSubscription);

// Route de test (pour les tests)
router.post('/test', verifyToken, pushNotificationController.testNotification);

module.exports = router; 