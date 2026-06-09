// ============================================================
//  CONFIGURATION FIREBASE — À remplir par l'organisateur
// ============================================================
//
//  1. Aller sur https://console.firebase.google.com
//  2. Créer un projet (ex: "worldcup-2026-groupe")
//  3. Ajouter une application Web (</> dans les paramètres du projet)
//  4. Copier le firebaseConfig et coller les valeurs ci-dessous
//  5. Dans Firebase Console > Build > Firestore Database : créer la base (mode test)
//  6. Dans Firebase Console > Build > Realtime Database (optionnel, on utilise Firestore)
//
//  Règles Firestore recommandées (mode test, valables 30 jours) :
//  rules_version = '2';
//  service cloud.firestore {
//    match /databases/{database}/documents {
//      match /{document=**} { allow read, write: if true; }
//    }
//  }
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID",
};

// Mettre à true une fois Firebase configuré
const FIREBASE_ENABLED = false;
