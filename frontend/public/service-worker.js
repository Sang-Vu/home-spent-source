const CACHE_NAME = "expense-tracker-v1";

self.addEventListener("install", (event) => {
  console.log("Service Worker: installing");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add("./");
    }),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: activated");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Chỉ xử lý GET.
  // POST tới Google Apps Script phải đi thẳng ra network.
  if (request.method !== "GET") {
    return;
  }

  // Navigation request: mở app khi offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch(() => {
          return caches.match("./");
        }),
    );

    return;
  }

  // Static resources: cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    }),
  );
});
