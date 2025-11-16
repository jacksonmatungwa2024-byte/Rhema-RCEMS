self.addEventListener("install", () => {
  console.log("Service Worker: Installed");
});

self.addEventListener("activate", () => {
  console.log("Service Worker: Activated");
});

self.addEventListener("fetch", (event) => {
  // Optional: caching logic here
});
