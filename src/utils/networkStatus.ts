// utils/networkStatus.ts
export function initNetworkStatus(callback: (status: string) => void) {
  // Listener for offline
  window.addEventListener("offline", () => {
    callback("😞 Umepoteza internet, uko offline.");
  });

  // Listener for online
  window.addEventListener("online", () => {
    callback("🤗 Umerudi online!");
  });

  // Initial check
  if (!navigator.onLine) {
    callback("😞 Umepoteza internet, uko offline.");
  } else {
    callback("✅ Internet iko active.");
  }
}
