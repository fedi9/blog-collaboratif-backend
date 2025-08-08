const webpush = require('web-push');
const Subscription = require('../models/Subscription');

class PushNotificationService {
    constructor() {
        // Configuration des clés VAPID
        const vapidKeys = {
            publicKey: process.env.VAPID_PUBLIC_KEY,
            privateKey: process.env.VAPID_PRIVATE_KEY
        };

        webpush.setVapidDetails(
            'mailto:admin@blog-collaboratif.com',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
    }

    // Enregistrer un nouvel abonnement
    async subscribeUser(userId, subscriptionData) {
        try {
            const { endpoint, keys } = subscriptionData;

            
            let subscription = await Subscription.findOne({ endpoint });

            if (subscription) {
                
                subscription.user = userId;
                subscription.keys = keys;
                subscription.isActive = true;
                subscription.lastUsed = new Date();
                await subscription.save();
            } else {
                
                subscription = new Subscription({
                    user: userId,
                    endpoint,
                    keys
                });
                await subscription.save();
            }

            console.log(`✅ Abonnement push enregistré pour l'utilisateur ${userId}`);
            return subscription;
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement de l\'abonnement:', error);
            throw error;
        }
    }

    // Désabonner un utilisateur
    async unsubscribeUser(userId, endpoint) {
        try {
            const subscription = await Subscription.findOne({ user: userId, endpoint });
            if (subscription) {
                subscription.isActive = false;
                await subscription.save();
                console.log(`✅ Utilisateur ${userId} désabonné des notifications push`);
            }
        } catch (error) {
            console.error('❌ Erreur lors du désabonnement:', error);
            throw error;
        }
    }

    // Envoyer une notification à un utilisateur spécifique
    async sendNotificationToUser(userId, notification) {
        try {
            const subscriptions = await Subscription.find({ 
                user: userId, 
                isActive: true 
            });

            if (subscriptions.length === 0) {
                console.log(`ℹ️ Aucun abonnement actif trouvé pour l'utilisateur ${userId}`);
                return;
            }

            const payload = JSON.stringify({
                title: notification.title,
                body: notification.message,
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/badge-72x72.png',
                data: {
                    url: notification.url || '/',
                    articleId: notification.articleId,
                    commentId: notification.commentId,
                    type: notification.type
                }
            });

            const results = await Promise.allSettled(
                subscriptions.map(async (subscription) => {
                    try {
                    
                        if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
                            console.log(`⚠️ Abonnement ${subscription._id} a des clés invalides, le désactiver`);
                            subscription.isActive = false;
                            await subscription.save();
                            return { success: false, error: 'Clés invalides' };
                        }

                        await webpush.sendNotification(
                            {
                                endpoint: subscription.endpoint,
                                keys: subscription.keys
                            },
                            payload
                        );
                        
                        
                        subscription.lastUsed = new Date();
                        await subscription.save();
                        
                        console.log(`✅ Notification envoyée à l'utilisateur ${userId}`);
                        return { success: true, subscriptionId: subscription._id };
                    } catch (error) {
                        console.error(`❌ Erreur lors de l'envoi de notification à ${subscription.endpoint}:`, error);
                        
                    
                        if (error.statusCode === 410 || error.statusCode === 404 || error.message.includes('p256dh value should be 65 bytes long')) {
                            subscription.isActive = false;
                            await subscription.save();
                            console.log(`🔄 Abonnement ${subscription._id} désactivé (invalide)`);
                        }
                        
                        return { success: false, error: error.message };
                    }
                })
            );

            const successfulSends = results.filter(result => result.status === 'fulfilled' && result.value.success);
            console.log(`📊 Notifications envoyées: ${successfulSends.length}/${subscriptions.length} réussies`);

        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de notification:', error);
            throw error;
        }
    }

    
    async sendNotificationToArticle(articleId, notification) {
        try {
           
            console.log(`📢 Notification d'article ${articleId}: ${notification.title}`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de notification d\'article:', error);
            throw error;
        }
    }

    // Obtenir les abonnements d'un utilisateur
    async getUserSubscriptions(userId) {
        try {
            return await Subscription.find({ user: userId, isActive: true });
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des abonnements:', error);
            throw error;
        }
    }

    // Supprimer un abonnement spécifique
    async deleteSubscription(subscriptionId, userId) {
        try {
            const subscription = await Subscription.findOne({ 
                _id: subscriptionId, 
                user: userId 
            });
            
            if (subscription) {
                await subscription.deleteOne();
                console.log(`✅ Abonnement ${subscriptionId} supprimé`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erreur lors de la suppression de l\'abonnement:', error);
            throw error;
        }
    }
}

module.exports = new PushNotificationService(); 