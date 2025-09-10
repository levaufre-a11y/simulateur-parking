const CACHE_NAME = 'parking-simulator-v2'; // J'ai incrémenté la version du cache pour forcer la mise à jour
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js'
];

// Installation du Service Worker et mise en cache des ressources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Stratégie "Cache d'abord, puis réseau" (modifiée)
self.addEventListener('fetch', event => {
  // Si la requête est une requête POST, on ne la traite pas avec le service worker.
  // On laisse le navigateur la gérer. Le SDK de Firestore s'occupera de la persistance hors ligne.
  if (event.request.method !== 'GET') {
    return;
  }

  // Pour les autres requêtes (GET), on utilise la stratégie "Cache d'abord, puis réseau".
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Le cache a trouvé une réponse - on la retourne
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Nettoyage des anciens caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});