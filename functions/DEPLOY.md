# Déployer les notifications Web Push (Cloud Function)

Cette Cloud Function envoie un Web Push FCM à tous les appareils abonnés
dès que tu publies une annonce dans l'app. Elle marche même quand l'app
des autres est **complètement fermée**.

## Une seule fois : préparation

1. **Plan Blaze (gratuit à ce volume)**
   Console Firebase → ⚙️ → Usage et facturation → passe en **Blaze**.
   (Cloud Functions exige Blaze, mais le quota gratuit couvre largement un groupe d'amis : 0 € en pratique.)

2. **Installe les outils** (sur ton ordi, une fois) :
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

## Déploiement

Depuis la racine du projet (`worldcup-2026/`) :

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

C'est tout. La fonction `sendBroadcastPush` se déclenche automatiquement.

## Tester

1. Ouvre l'app sur ton téléphone, autorise les notifications.
   → Ton token FCM est enregistré dans Firestore (`users/{id}.fcmToken`).
2. **Ferme complètement l'app.**
3. Depuis le tableau de bord admin (PIN), envoie une annonce.
4. La notification doit arriver même app fermée. 🎉

## Notes

- La clé publique VAPID est déjà dans `firebase-config.js` (côté réception).
- Aucune clé secrète n'est exposée : l'envoi se fait côté serveur via `firebase-admin`.
- Les tokens invalides (app désinstallée) sont nettoyés automatiquement.
