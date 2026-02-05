# Historique des Déploiements et Rollback

Ce fichier répertorie les points de restauration critiques du projet DigitalQRCard. 
En cas de bug majeur, utilisez ces tags pour revenir en arrière.

---

## [V1.0.2] - 2026-02-05
**Statut : STABLE / SÉCURISÉ**

### 🛡️ Sécurité (Urgent)
- **Purge de l'historique Git** : Suppression totale de toutes les traces de fichiers `.env` et `GoogleService-Info.plist` qui avaient été commis par erreur.
- **Gitignore renforcé** : Protection stricte contre la fuite de clés API.

### 🚀 Améliorations UX & Fonctionnalités
- **vCard Social Fix** : Les réseaux sociaux (Instagram, Telegram, WhatsApp, Zalo) sont maintenant encodés en tant qu'URLs standards dans le QR Code. Ils sont désormais **cliquables** directement après le scan sur iPhone et Android.
- **Flux d'abonnement Premium** : 
  - Ajout d'un modal d'explication "Account Required" avant de demander la connexion. 
  - Boutons de plans verrouillés pour les utilisateurs non connectés avec redirection vers un login professionnel.
- **PWA Auto-Update** : Le site vérifie désormais les mises à jour toutes les 30 secondes et force le rafraîchissement pour garantir que les utilisateurs ont toujours la dernière version fixée.

### 🔧 Technique
- Fix `ReferenceError: user is not defined` dans le modal de pricing.
- Fix de l'import manquant de l'icône `Lock`.

---

## [V1.0.1] - 2026-01-04
- Amélioration du layout des boutons d'actions (Smart Grid).

## [V1.0.0] - 2026-01-04
- Release initiale officielle.
