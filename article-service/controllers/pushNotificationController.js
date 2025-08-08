const pushNotificationService = require('../services/pushNotificationService');

// Obtenir la clé publique VAPID
exports.getVapidPublicKey = (req, res) => {
    try {
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        if (!publicKey) {
            return res.status(500).json({ 
                message: 'Clé VAPID publique non configurée' 
            });
        }
        
        res.json({ 
            publicKey: publicKey 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la clé VAPID:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération de la clé VAPID' 
        });
    }
};

// S'abonner aux notifications push
exports.subscribe = async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id || req.user.userId;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ 
                message: 'Données d\'abonnement invalides' 
            });
        }

        const savedSubscription = await pushNotificationService.subscribeUser(userId, subscription);
        
        res.status(201).json({
            message: 'Abonnement aux notifications push créé avec succès',
            subscription: savedSubscription
        });
    } catch (error) {
        console.error('Erreur lors de l\'abonnement:', error);
        res.status(500).json({ 
            message: 'Erreur lors de l\'abonnement aux notifications push' 
        });
    }
};

// Se désabonner des notifications push
exports.unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user.id || req.user.userId;

        if (!endpoint) {
            return res.status(400).json({ 
                message: 'Endpoint requis pour le désabonnement' 
            });
        }

        await pushNotificationService.unsubscribeUser(userId, endpoint);
        
        res.json({
            message: 'Désabonnement effectué avec succès'
        });
    } catch (error) {
        console.error('Erreur lors du désabonnement:', error);
        res.status(500).json({ 
            message: 'Erreur lors du désabonnement' 
        });
    }
};

// Obtenir les abonnements de l'utilisateur
exports.getUserSubscriptions = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const subscriptions = await pushNotificationService.getUserSubscriptions(userId);
        
        res.json({
            subscriptions: subscriptions
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des abonnements:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des abonnements' 
        });
    }
};

// Supprimer un abonnement spécifique
exports.deleteSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const userId = req.user.id || req.user.userId;

        const deleted = await pushNotificationService.deleteSubscription(subscriptionId, userId);
        
        if (deleted) {
            res.json({
                message: 'Abonnement supprimé avec succès'
            });
        } else {
            res.status(404).json({
                message: 'Abonnement non trouvé'
            });
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'abonnement:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la suppression de l\'abonnement' 
        });
    }
};

// Tester l'envoi d'une notification (pour les tests)
exports.testNotification = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { title, message } = req.body;

        const notification = {
            title: title || 'Test de notification',
            message: message || 'Ceci est un test de notification push',
            url: '/',
            type: 'test'
        };

        await pushNotificationService.sendNotificationToUser(userId, notification);
        
        res.json({
            message: 'Notification de test envoyée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification de test:', error);
        res.status(500).json({ 
            message: 'Erreur lors de l\'envoi de la notification de test' 
        });
    }
}; 