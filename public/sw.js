self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("lumina-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/offline.html",
        "/manifest.json",
        "/aerial.mp4",
        "/theme.mp3",
        "/intro-tone.mp3",
        "/icons/icon-192.png",
        "/icons/icon-256.png",
        "/icons/icon-384.png",
        "/icons/icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((res) => {
      return res || caches.match("/offline.html");
    }))
  );
});
