// Service Worker pour les notifications push
const CACHE_NAME = 'blog-collaboratif-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Fichiers à mettre en cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/badge-72x72.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker: Installation en cours...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('✅ Service Worker: Cache statique ouvert');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation terminée');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erreur lors de l\'installation:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activation en cours...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Suppression du cache ancien:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation terminée');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erreur lors de l\'activation:', error);
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers l'API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse du cache si elle existe
        if (response) {
          return response;
        }

        // Sinon, faire la requête réseau
        return fetch(event.request)
          .then((networkResponse) => {
            // Mettre en cache la réponse pour les requêtes réussies
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallback pour les pages HTML
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('📱 Service Worker: Notification push reçue');
  
  let notificationData = {
    title: 'Nouvelle notification',
    body: 'Vous avez reçu une nouvelle notification',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  // Récupérer les données de la notification si disponibles
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (error) {
      console.error('❌ Service Worker: Erreur lors du parsing des données de notification:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/assets/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/assets/icons/badge-72x72.png'
      }
    ],
    vibrate: [200, 100, 200],
    tag: 'blog-notification'
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Clic sur notification');
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Ouvrir l'application ou la page spécifique
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focaliser
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('🔒 Service Worker: Notification fermée');
  
  // Ici vous pouvez envoyer des analytics ou d'autres données
  const notificationData = {
    type: 'notification_closed',
    timestamp: Date.now(),
    notificationId: event.notification.tag
  };
  
  // Envoyer les données au serveur si nécessaire
  // self.registration.pushManager.getSubscription().then(subscription => {
  //   if (subscription) {
  //     fetch('/api/push-notifications/analytics', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(notificationData)
  //     });
  //   }
  // });
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Service Worker: Chargé et prêt'); 