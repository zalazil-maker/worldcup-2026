const CACHE_NAME = "worldcup-2026-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// Receive scheduled notification messages from the main page
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SCHEDULE_NOTIFICATION") {
    const { delay, title, body, tag } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        tag,
        icon: "https://em-content.zobj.net/source/apple/391/trophy_1f3c6.png",
        badge: "https://em-content.zobj.net/source/apple/391/trophy_1f3c6.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: { url: self.registration.scope },
      });
    }, delay);
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((wins) => {
      if (wins.length) return wins[0].focus();
      return clients.openWindow(e.notification.data?.url || "/");
    })
  );
});
