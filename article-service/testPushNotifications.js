const axios = require('axios');

const API_BASE_URL = 'http://localhost:5002/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTJjM2E4NWQxNmVkZDk0MzNmYjhjNSIsInVzZXJuYW1lIjoiaXllZCIsImVtYWlsIjoiaXllZEBleGFtcGxlLmNvbSIsInJvbGUiOiJSZWRhY3RldXIiLCJpYXQiOjE3NTQ2MDk0NDcsImV4cCI6MTc1NDYxMzA0N30.c38m7Ugb2O_8UjpQRX60P5zYfVpmI4cmEHivgqWGtvE';

async function testPushNotifications() {
    console.log('🧪 Test des notifications push...\n');

    try {
        // 1. Test de récupération de la clé VAPID publique
        console.log('1️⃣ Test de récupération de la clé VAPID publique...');
        const vapidResponse = await axios.get(`${API_BASE_URL}/push-notifications/vapid-public-key`);
        console.log('✅ Clé VAPID publique récupérée:', vapidResponse.data.publicKey);
        console.log('');

        // 2. Test d'abonnement aux notifications push (avec des clés plus réalistes)
        console.log('2️⃣ Test d\'abonnement aux notifications push...');
        const subscriptionData = {
            subscription: {
                endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
                keys: {
                    p256dh: 'BEl62iUYgUvxixkXt31sCSOrkRrFhD3HC43bx-0GJ8tb2kWrR6tksxYjro0NqFXwN87jcG51qumSgU0wB9G8N0',
                    auth: 'tBHIjMcm29bG9mXHgxppXg'
                }
            }
        };

        const subscribeResponse = await axios.post(
            `${API_BASE_URL}/push-notifications/subscribe`,
            subscriptionData,
            {
                headers: {
                    'Authorization': `Bearer ${TEST_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Abonnement créé:', subscribeResponse.data.message);
        console.log('');

        // 3. Test de récupération des abonnements de l'utilisateur
        console.log('3️⃣ Test de récupération des abonnements...');
        const subscriptionsResponse = await axios.get(
            `${API_BASE_URL}/push-notifications/subscriptions`,
            {
                headers: {
                    'Authorization': `Bearer ${TEST_TOKEN}`
                }
            }
        );
        console.log('✅ Abonnements récupérés:', subscriptionsResponse.data.subscriptions.length, 'abonnement(s)');
        console.log('');

        // 4. Test d'envoi d'une notification de test (cette fois avec gestion d'erreur)
        console.log('4️⃣ Test d\'envoi d\'une notification de test...');
        const testNotificationData = {
            title: 'Test de notification',
            message: 'Ceci est un test de notification push depuis le backend'
        };

        try {
            const testResponse = await axios.post(
                `${API_BASE_URL}/push-notifications/test`,
                testNotificationData,
                {
                    headers: {
                        'Authorization': `Bearer ${TEST_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('✅ Notification de test envoyée:', testResponse.data.message);
        } catch (testError) {
            console.log('⚠️ Notification de test échouée (normal avec des clés de test):', testError.response?.data?.message || testError.message);
        }
        console.log('');

        console.log('🎉 Tests terminés !');
        console.log('💡 Note: Les notifications push ne fonctionnent qu\'avec de vraies clés générées par le navigateur.');

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

// Exécuter les tests
testPushNotifications(); 