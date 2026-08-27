/* ============================================================
   ANIMAL OPPOSITES — Service Worker
   Offline support + caching
   ============================================================ */

const CACHE_NAME = "animal-opposites-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json"
];


/* ============================================================
   INSTALL
   ============================================================ */

self.addEventListener("install", event => {

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(APP_FILES);

      })

  );

  /*
    Activate the new service worker immediately.
  */

  self.skipWaiting();
});


/* ============================================================
   ACTIVATE
   ============================================================ */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(cacheNames => {

      return Promise.all(

        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))

      );

    })

  );

  self.clients.claim();
});


/* ============================================================
   FETCH
   ============================================================ */

self.addEventListener("fetch", event => {

  /*
    Only handle GET requests.
  */

  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(

    caches.match(event.request)
      .then(cachedResponse => {

        /*
          Use the cached version when available.
        */

        if (cachedResponse) {
          return cachedResponse;
        }

        /*
          Otherwise try the network.
        */

        return fetch(event.request)
          .then(networkResponse => {

            /*
              Save a copy for future offline use.
            */

            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {

              const responseCopy =
                networkResponse.clone();

              caches.open(CACHE_NAME)
                .then(cache => {

                  cache.put(
                    event.request,
                    responseCopy
                  );

                });
            }

            return networkResponse;
          })
          .catch(() => {

            /*
              If the network is unavailable,
              fall back to index.html.
            */

            return caches.match(
              "./index.html"
            );

          });

      })

  );
});
