const CACHE_NAME = "worldcup-2026-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// FCM / Web Push: app closed → still shows the notification
self.addEventListener("push", (e) => {
  let title = "WC2026 📣";
  let body = "";
  let tag = "fcm-broadcast";
  try {
    const payload = e.data?.json();
    title = payload?.notification?.title || payload?.data?.title || payload?.title || title;
    body  = payload?.notification?.body  || payload?.data?.body  || payload?.body  || body;
    tag   = payload?.data?.tag || tag;
  } catch (_) {
    try { body = e.data?.text() || ""; } catch (_2) {}
  }
  e.waitUntil(
    self.registration.showNotification(title, {
      body, tag,
      icon: "/worldcup-2026/icon-192.png",
      badge: "/worldcup-2026/icon-192.png",
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: { url: self.registration.scope },
    })
  );
});

// Receive scheduled notification messages from the main page
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SCHEDULE_NOTIFICATION") {
    const { delay, title, body, tag } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        tag,
        icon: "/worldcup-2026/icon-192.png",
        badge: "/worldcup-2026/icon-192.png",
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
