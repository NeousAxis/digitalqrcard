# 🔐 IAP BACKUP — Digital QR Cards

**Date archivage** : 2026-05-16
**Build au moment de la désactivation** : 1.0 (61) → resoumission build 62 sans IAP
**Raison** : Apple rejette la review tant que les abonnements sont configurés/visibles
sans pouvoir être validés proprement. Décision (stratégie validée sur Wise Weather) :
shipper la **v1.0 SANS IAP**, supprimer les abonnements d'App Store Connect, les
recréer en **V2**.

Tout le code IAP est **TOUJOURS PRÉSENT** dans `src/App.jsx`, simplement gaté par
`IAP_ENABLED = false`. **Aucun code à réécrire** — un seul booléen réactive tout.

---

## 1. Configuration App Store Connect (à recréer manuellement en V2)

### Subscription Group
- **Name / Reference Name** : `Abonnement DigitalQrCard`
- **ASC Group ID (supprimé)** : `21907831`

### Subscriptions (2)

| Product ID | Reference Name | Période | Prix CH | Prix US | Plan app | Limite cartes |
|------------|----------------|---------|---------|---------|----------|---------------|
| `Standard_898` | Standard Pack | 1 mois (ONE_MONTH) | CHF 2.00 | USD 1.99 | `basic` | 3 cartes |
| `Premium_898`  | Premium Pack  | 1 mois (ONE_MONTH) | CHF 4.00 | USD 4.99 | `pro`   | 5 cartes |

> Prix propagés sur ~50 territoires lors de la config initiale.

### Localisations abonnements (à recréer — EN-US + FR-FR recommandés)

À la suppression, seule une localisation **en-GB** existait (incomplète) :

| Product ID | Locale | Display Name | Description |
|------------|--------|--------------|-------------|
| `Standard_898` | en-GB | Standard Pack | Monthly Subscription |
| `Premium_898`  | en-GB | Premium Pack  | Premium Subscription |

**En V2, créer des localisations propres EN-US + FR-FR** décrivant les avantages réels
(cf. table « Plans » §2).

### Review notes (par abonnement)
> Subscription plan for Digital QR Cards

---

## 2. Code IAP (déjà en place dans `src/App.jsx`)

### Feature flag
```js
// FEATURE FLAG — set to true to re-enable in-app purchases (V2).
// v1.0 ships without paid offers: no IAP UI, no StoreKit init, all features unlocked.
const IAP_ENABLED = false;
```
Défini juste après l'objet `PRICING` (~ligne 291).

### Plans (objet `PRICING`, ~ligne 285)
```js
const PRICING = {
  basic: { price: '2 CHF', limit: 3, key: 'standardPack', productId: 'Standard_898' },
  pro:   { price: '4 CHF', limit: 5, key: 'premiumPack',  productId: 'Premium_898' }
};
```

| Plan | Limite cartes | Photo/Logo | Réseaux sociaux | Infos entreprise | Champs perso |
|------|---------------|-----------|------------------|------------------|--------------|
| free   | 1 | ❌ | ❌ | ❌ | ❌ |
| basic  | 3 | ✅ | ✅ | ✅ | ❌ |
| pro    | 5 | ✅ | ✅ | ✅ | ✅ |

### Comportement quand `IAP_ENABLED = false` (v1.0)
- `effectivePlan = IAP_ENABLED ? subscription : 'pro'` → **tous les utilisateurs ont
  l'accès complet** (5 cartes, photo, réseaux, entreprise, champs perso).
- Aucun paywall, aucun badge de plan, aucun bouton « Upgrade », aucune init StoreKit.

### Composants / blocs gatés (présents, juste désactivés)
| Élément | Repère dans `src/App.jsx` |
|---------|---------------------------|
| `const IAP_ENABLED` | ~ligne 291 |
| `const effectivePlan` | dans `App()`, après `storeReadyRef` |
| `useEffect` init StoreKit (`// --- IAP LOGIC ---`) | `if (!IAP_ENABLED) return;` en tête |
| `handleNativePurchase` | `if (!IAP_ENABLED) return;` en tête |
| Sync `pendingPlan` (dans `fetchSubscription`) | condition `IAP_ENABLED && ...` |
| Overlay verrou photo (composant éditeur) | `IAP_ENABLED && subscription === 'free'` |
| Badge plan header `plan-badge-pro` | `{IAP_ENABLED && (...)}` |
| Lignes « Current Plan / Status / Renewal » (Settings) | `{IAP_ENABLED && (...)}` |
| Bouton gestion abonnement (Settings) | `IAP_ENABLED && subscription !== 'free'` |
| Bouton « Upgrade » (footer nav) | `{IAP_ENABLED && (...)}` |
| Rendu `<PricingModal>` | `IAP_ENABLED && showPricing && (...)` |
| Composant `PricingModal` | intact, non rendu |

### Plugin Capacitor
- ⚠️ **Build 63** : `cordova-plugin-purchase` a été **RETIRÉ de `package.json`** (et la
  capability `com.apple.InAppPurchase` retirée du `project.pbxproj`) pour qu'Apple ne
  réclame plus d'IAP (rejet 2.1b). Le code JS qui l'utilise reste présent mais gaté.
- **Pour la V2, réinstaller le plugin** : `npm install cordova-plugin-purchase` puis
  `npx cap sync ios`, et ré-cocher la capability In-App Purchase dans Xcode.
- Flux v13 : `approved` → `transaction.verify()` → `verified` → `receipt.finish()`.
- Plateforme : `APPLE_APPSTORE`, type `PAID_SUBSCRIPTION`.

### Mapping produit → plan (dans le listener `verified`)
```
Standard_898 → 'basic'
Premium_898  → 'pro'
```

### Persistance backend (Appwrite)
- Project ID `69c62a550031e83fd11e`, endpoint `https://fra.cloud.appwrite.io/v1`
- Database `digitalqrcard`, collection `users`
- Champs écrits à l'achat : `subscription` (`free`/`basic`/`pro`), `updated_at`,
  `iap_transaction_id`
- Achat hors-ligne / non connecté : `localStorage` clé `pending_subscription`,
  synchronisée au prochain login dans `fetchSubscription`.

---

## 3. Restoration playbook (V2)

### A. Côté App Store Connect (manuel via web UI)
1. App Store Connect → Digital QR Cards → **Monetization → Subscriptions**
2. **Create Subscription Group** : `Abonnement DigitalQrCard`
3. Pour chaque abonnement :
   - `+` → Auto-Renewable Subscription
   - Product ID **exact** : `Standard_898` puis `Premium_898`
   - Reference Name : `Standard Pack` / `Premium Pack`
   - Durée : 1 mois chacun
   - Localisations EN-US + FR-FR (avantages réels, cf. §2)
   - Prix : Suisse CHF 2.00 / 4.00 → propager aux autres territoires
   - Review Information : « Subscription plan for Digital QR Cards »
   - Save
4. **Attacher les 2 abonnements à la soumission de la version V2** (sinon rejet 2.1b).

### B. Côté code
```js
// src/App.jsx — remettre :
const IAP_ENABLED = true;
```
Réinstaller aussi le plugin (retiré en build 63) :
```bash
npm install cordova-plugin-purchase
```
Puis ré-activer la capability **In-App Purchase** sur la cible App dans Xcode.

### C. Build + soumettre
1. `npm run build && npx cap sync ios`
2. Re-ajouter `#import <Foundation/Foundation.h>` en 1re ligne de
   `ios/capacitor-cordova-ios-plugins/sources/CordovaPluginPurchase/FileUtility.h`
3. Bumper `CURRENT_PROJECT_VERSION` (pbxproj) ET `CFBundleVersion` (Info.plist)
4. `cd ios/App && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 fastlane release`
5. Attacher build + abonnements à la version, `fastlane submit`

### D. Test sandbox
- App Store Connect → Users and Access → Sandbox Testers → créer un testeur
- Sur device : Réglages → App Store → Compte Sandbox → se connecter
- App → Upgrade → tester un achat (gratuit en sandbox)

---

## 4. IDs Apple — référence historique (INUTILISABLES après suppression)

| Élément | ASC ID (supprimé le 2026-05-16) |
|---------|--------------------------------|
| Subscription Group « Abonnement DigitalQrCard » | `21907831` |
| `Standard_898` | `6758340651` |
| `Premium_898`  | `6758342252` |
| Localisation en-GB Standard_898 | `1d8023ec-46c7-4590-b852-e047cc246225` |
| Localisation en-GB Premium_898  | `3dce792e-fa17-4131-83fb-23af959ed651` |

Les Product IDs (`Standard_898`, `Premium_898`) restent réservés par Apple et doivent
être **réutilisés tels quels** en V2.

---

## 5. Constantes projet

- **App** : Digital QR Cards
- **Bundle ID** : `com.cyrilleger.digitalqrcardpro`
- **App Store Connect App ID** : `6758325036`
- **Team ID** : `BXB662X8PV`
- **API Key** : `~/private_keys/AuthKey_8QAFD5C266.p8` (Key ID `8QAFD5C266`,
  Issuer `b140c75c-a30c-4ea7-ad1c-5dda1c16945e`)
- **Fastlane** : `ios/App/fastlane/Fastfile` (lanes : `release`, `metadata`, `submit`)

**Estimation restauration V2** : ~30 min côté code (déjà tout codé) + ~1 h côté ASC
(recréation des 2 abonnements avec localisations EN/FR).
