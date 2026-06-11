// ============================================================
//  Cloud Functions — WC2026 watch-party
//  Envoie un Web Push FCM à tous les appareils abonnés
//  dès que l'organisateur publie une annonce (/broadcast/latest).
//  Aucune clé secrète côté client : tout se passe ici, côté serveur.
// ============================================================

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

exports.sendBroadcastPush = onDocumentWritten("broadcast/latest", async (event) => {
  const after = event.data?.after?.data();
  // Document supprimé → rien à envoyer
  if (!after) return;

  const before = event.data?.before?.data();
  // Ne notifie que pour une NOUVELLE annonce (sentAt change)
  if (before && before.sentAt === after.sentAt) return;

  const title = after.title || "WC2026 📣";
  const body = after.body || "";

  const db = getFirestore();
  const snap = await db.collection("users").get();

  const tokens = [];
  snap.forEach((d) => {
    const t = d.data().fcmToken;
    if (t) tokens.push(t);
  });
  if (!tokens.length) {
    console.log("Aucun token FCM enregistré.");
    return;
  }

  const messaging = getMessaging();
  const message = {
    notification: { title, body },
    data: { title, body, tag: "fcm-broadcast" },
    webpush: {
      notification: {
        icon: "/worldcup-2026/icon-192.png",
        badge: "/worldcup-2026/icon-192.png",
        requireInteraction: true,
      },
      fcmOptions: { link: "/worldcup-2026/" },
    },
  };

  // sendEachForMulticast gère jusqu'à 500 tokens par appel
  const invalid = [];
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const res = await messaging.sendEachForMulticast({ ...message, tokens: batch });
    res.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = r.error?.code || "";
        if (code.includes("registration-token-not-registered") || code.includes("invalid-argument")) {
          invalid.push(batch[idx]);
        }
      }
    });
    console.log(`Lot envoyé : ${res.successCount} OK / ${res.failureCount} échecs`);
  }

  // Nettoyage des tokens morts
  if (invalid.length) {
    const dead = new Set(invalid);
    const batch = db.batch();
    snap.forEach((d) => {
      if (dead.has(d.data().fcmToken)) {
        batch.update(d.ref, { fcmToken: FieldValue.delete() });
      }
    });
    try { await batch.commit(); } catch (_) {}
    console.log(`${invalid.length} token(s) invalide(s) nettoyé(s).`);
  }
});
