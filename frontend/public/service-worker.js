// In your service worker
const CACHE_NAME = 'brainbytes-v1';

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if available
        if (response) {
          return response;
        }

        // Otherwise, fetch from network and cache for later
        return fetch(event.request)
          .then((response) => {
            // Clone the response as it can only be used once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Return offline page if network fails
        return new Response('Offline - Please check your connection');
      })
  );
});