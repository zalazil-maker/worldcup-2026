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

// ── Clé API The Odds API (cotes bookmakers en direct) ──
// Gratuit : 500 requêtes/mois → https://the-odds-api.com/
// Laisse vide "" pour utiliser uniquement les cotes calculées par Elo.
const ODDS_API_KEY = "";

