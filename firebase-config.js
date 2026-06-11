// ============================================================
//  CONFIGURATION FIREBASE — Projet "WC2026"
// ============================================================
//
//  Synchronisation en temps réel activée pour le groupe.
//
//  Règles Firestore recommandées (Console > Firestore > Règles) :
//  rules_version = '2';
//  service cloud.firestore {
//    match /databases/{database}/documents {
//      match /{document=**} { allow read, write: if true; }
//    }
//  }
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD8HbcigAoMnv7BEXzTaV7t_aehqFaXepQ",
  authDomain: "wc2026-2f20c.firebaseapp.com",
  projectId: "wc2026-2f20c",
  storageBucket: "wc2026-2f20c.firebasestorage.app",
  messagingSenderId: "118886458170",
  appId: "1:118886458170:web:9e3be211aa5ea3f035a603",
  measurementId: "G-HZFNWXMM6V",
};

// Synchronisation temps réel activée
const FIREBASE_ENABLED = true;

// ── Code PIN de l'espace organisateur (à changer !) ──
// Sert à ouvrir le tableau de bord admin (liste des joueurs, présences, paris).
const ADMIN_PIN = "2026";

// ── Clé API odds-api.io (vraies cotes Bet365 + live in-play) ──
// Gratuit → https://odds-api.io/  ·  100 requêtes / fenêtre
// Donne les vraies cotes du bookmaker, qui bougent en direct quand un but est marqué.
// Laisse vide "" pour utiliser le modèle Poisson interne (sans clé).
const ODDS_API_KEY = "9d202e2213e8ac55c2d687a820cb9756d272bc78c1533c17814a66898afd4601";
const ODDS_API_LEAGUE = "international-fifa-world-cup";
const ODDS_API_BOOKMAKER = "Bet365";

// ── Firebase Cloud Messaging — Web Push (notifications app fermée) ──
// 1. Console Firebase → Paramètres du projet → Cloud Messaging
// 2. Activer "Cloud Messaging API (Legacy)" → copier la Clé du serveur ci-dessous
// 3. Onglet "Certificats Web Push" → Générer une paire de clés → copier la clé publique VAPID
const FCM_SERVER_KEY = "";   // Clé du serveur (legacy) — ex: "AAAAxxx..."
const FCM_VAPID_KEY  = "";   // Clé publique VAPID      — ex: "BNHxxx..."

