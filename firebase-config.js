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
