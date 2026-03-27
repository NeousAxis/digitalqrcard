# Digital QR Cards iOS - CLAUDE.md

## Projet
Application iOS de creation et partage de cartes de visite numeriques avec QR codes.
Deploye sur Firebase (projet: `digitalqrcard-8fdb8`).

## Stack technique
- **Frontend**: React 19 + Vite 7 + CSS
- **Native**: Capacitor 8 (bridge iOS)
- **Backend**: Firebase (Firestore + Auth + Hosting)
- **Auth iOS**: Firebase Auth (Apple Sign-In + Email/Password via @capacitor-firebase/authentication) — Google Sign-In retire de l'app iOS
- **Auth Web**: Firebase Auth (Google + Apple Sign-In + Email/Password)
- **Paiements iOS**: Apple IAP via cordova-plugin-purchase v13.12.1
- **Paiements Web**: Stripe (masque sur iOS natif)
- **QR**: qrcode.react

## Architecture
- `src/App.jsx` — Composant principal (~2600 lignes), contient toute la logique
- `ios/` — Projet Xcode natif (Capacitor)
- `functions/` — Firebase Cloud Functions (plan Spark — pas deployable sans Blaze)
- `public/` — Fichiers statiques (privacy.html, support.html)
- `capacitor.config.json` — Config Capacitor

## Commandes
```bash
npm run build            # Build production
npx cap sync ios         # Sync avec iOS
cd ios/App && fastlane release  # Build + upload App Store
cd ios/App && fastlane metadata # Upload metadata + screenshots
cd ios/App && fastlane submit   # Soumettre pour review
firebase deploy --only hosting  # Deployer pages statiques
```

## IMPORTANT: Apres chaque `cap sync`
Le fichier `ios/capacitor-cordova-ios-plugins/sources/CordovaPluginPurchase/FileUtility.h` est ecrase. Il faut re-ajouter `#import <Foundation/Foundation.h>` en premiere ligne.

## App Store Submission
- **App ID**: 6758325036
- **Bundle ID**: com.cyrilleger.digitalqrcardpro
- **Team ID**: BXB662X8PV
- **API Key ID**: 8QAFD5C266
- **Fastlane**: `ios/App/fastlane/Fastfile` (lanes: release, metadata, submit)
- **Build actuel**: 1.0 (59)
- **Status**: WAITING_FOR_REVIEW (7eme soumission)

### Historique des rejets et corrections
1. **12 mars 2026** — Rejet initial
2. **20 mars 2026** — Build 47 rejete : Guideline 2.3.8 (icones Capacitor), 4.8 (pas de Sign in with Apple), 2.1(a) (bug iPad)
3. **21 mars 2026** — Build 48 rejete : Guideline 2.3.8 (icones encore "placeholder"), 4.8 (Apple Sign-In non visible), 2.1(a) (Google login "unresponsive"), 5.1.1(v) (pas de suppression de compte)
4. **21 mars 2026** — Build 49 rejete : MEMES problemes — les "fixes" precedents n'ont pas ete testes sur device

### Corrections appliquees — Build 49 (21 mars 2026)

#### Fix 1: Icone redesignee (Guideline 2.3.8)
- Ancienne icone (QR blanc simple sur bleu) trop "placeholder" pour Apple
- Nouvelle icone : carte de visite stylisee avec QR code, degrade riche navy-to-teal, ombres et relief
- 15 tailles generees, toutes sans canal alpha (verifie avec `sips`)
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

#### Fix 2: Apple Sign-In en premier (Guideline 4.8)
- Bouton Apple Sign-In deplace AVANT le bouton Google dans AuthModal
- Apple recommande que leur bouton soit le plus visible
- Code : `src/App.jsx` lignes 1544-1553

#### Fix 3: Google Sign-In avec feedback UI (Guideline 2.1a)
- Ajout d'un timeout de 10 secondes sur `FirebaseAuthentication.signInWithGoogle()`
- Si timeout ou erreur : message visible "Google Sign-In non disponible. Veuillez utiliser Sign in with Apple ou Email/Mot de passe."
- Utilise `setStatusMessage()` au lieu de `alert()` silencieux
- `Promise.race` avec timer pour eviter le blocage indefini
- Code : `src/App.jsx` fonction `handleLogin()`

#### Fix 4: Suppression de compte (Guideline 5.1.1v)
- Bouton "Delete Account" rouge dans Settings (avec icone Trash2)
- Double confirmation : dialog + saisir "DELETE"
- Suppression cote client (pas de Cloud Function — projet sur plan Spark) :
  1. Annule l'abonnement Stripe si actif (via `/api/cancel-subscription`)
  2. Supprime toutes les cartes Firestore (`users/{uid}/cards/*`)
  3. Supprime le document user (`users/{uid}`)
  4. Supprime le compte Firebase Auth (`deleteUser()`)
- Gestion erreur `auth/requires-recent-login` avec message adapte
- Code : `src/App.jsx` fonction `handleDeleteAccount()`

#### Fix 5: Info.plist corrige
- `armv7` supprime de `UIRequiredDeviceCapabilities` (obsolete 32-bit) → remplace par `arm64`
- `CFBundleDisplayName` change de `DigitalQRCardPro` a `Digital QR Cards` (coherent avec metadata)

### Notes Firebase
- Projet sur plan **Spark** (gratuit) — impossible de deployer des Cloud Functions
- La suppression de compte se fait entierement cote client via le Firebase JS SDK
- `functions/index.js` contient `deleteUserAccount` et `stripeWebhook` mais ne sont PAS deployes

### Corrections appliquees — Build 50 (21 mars 2026)

**Strategie** : Retirer Google Sign-In de l'app iOS pour eliminer le bug et simplifier l'auth.

#### Fix 1: Google Sign-In retire de l'app iOS (Guidelines 2.1a + 4.8)
- Bouton "Continuer avec Google" masque sur iOS natif via `{!Capacitor.isNativePlatform() && ...}`
- L'ecran auth iOS montre SEULEMENT : Email/Password + Sign in with Apple
- Google Sign-In reste disponible sur la version web
- Code : `src/App.jsx` ligne 1554 (condition ajoutee)

#### Fix 2: Nouvelle icone professionnelle (Guideline 2.3.8)
- 3eme redesign d'icone — cette fois generee via Node.js `canvas` module
- Design : degrade navy/violet/teal, carte de visite 3D inclinee avec QR code detaille, avatar, scanner brackets
- Master 1024x1024 = 308 KB (vs ~442 KB avant)
- 15 tailles generees avec `sips`, toutes sans alpha
- Verification E2E : les 15 fichiers ont les bonnes dimensions et hasAlpha=no

#### Fix 3: Delete Account avec modals React (Guideline 5.1.1v)
- Remplace `window.confirm()` et `window.prompt()` par des modals React natifs
- Ces APIs browser ne fonctionnent pas de maniere fiable dans WKWebView iOS
- Nouveau flow : modal avec texte d'avertissement + champ de saisie "DELETE" + boutons Cancel/Delete Forever
- Le bouton "Delete Forever" est desactive tant que "DELETE" n'est pas saisi
- States ajoutes : `showDeleteModal`, `deleteConfirmText`
- Code : `src/App.jsx` fonctions `handleDeleteAccount()` et `confirmDeleteAccount()`

#### Fix 4: Bug critique `getFunctions` non importe
- L'agent Cloud Function (session precedente) avait ajoute `const functions = getFunctions(app);` ligne 85 SANS importer `getFunctions`
- Resultat : `ReferenceError: getFunctions is not defined` → **ECRAN BLANC** (app completement cassee)
- Fix : suppression de la ligne inutile (la suppression de compte est cote client, pas via Cloud Function)
- **Build 50 soumis AVEC ce bug** (ERREUR d'orchestration — pas verifie l'ecran)
- **Build 51** corrige et resoumis

#### Verification E2E reelle (build 51)
- App testee dans le NAVIGATEUR (pas juste Xcode build) → ecran de login visible ✅
- Build Xcode compile sans erreur
- `cap sync` + fix FileUtility.h applique

### Corrections appliquees — Build 57 (27 mars 2026)

**Backend** : Migration complete Firebase → Appwrite Cloud
- **Appwrite Project ID** : `69c62a550031e83fd11e`
- **Appwrite Endpoint** : `https://fra.cloud.appwrite.io/v1`
- **Database** : `digitalqrcard` (collections: `users`, `cards`)
- Code migre dans `src/appwriteClient.js` + `src/App.jsx`
- Zero reference Firebase restante dans le code

**Fix rejet 5.1.1(v)** : IAP ne requiert pas de login sur iOS natif (deja OK build 50+)
**Fix rejet Guideline 4** : Permissions camera localisees EN + FR
- `Info.plist` : description en anglais
- `ios/App/App/en.lproj/InfoPlist.strings` : anglais
- `ios/App/App/fr.lproj/InfoPlist.strings` : francais

**Fix rejet 2.1(b)** : IAP simplifie
- Supprime les variantes de product IDs (bundle.id, bundle.-id, etc.)
- Garde uniquement les IDs exacts : `Standard_898`, `Premium_898`
- Meilleur error handling (messages utilisateur, pas de crash)

**Fix rejet 2.1(b)** : IAP screenshots uploades via API ASC

### Corrections appliquees — Build 59 (27 mars 2026)

**Rejet Build 58** : Guideline 2.1(a) login error + 2.1(b) IAP error — iPad Air 11" (M3), iPadOS 26.3.1

**Fix rejet 2.1(a)** : Appwrite bloquait les requetes depuis `capacitor://localhost` (403 "Invalid Scheme")
- Ajoute `"ios": { "scheme": "https" }` dans `capacitor.config.json`
- Appwrite autorise `https://localhost` — confirme par curl (HTTP 201)
- MEME bug que Wise Weather App (solution identique)

**Fix rejet 2.1(b)** : Race condition IAP — "Choose this plan" avant que le store soit pret
- Ajoute etat `storeReady` (state + ref) dans `App.jsx`
- `store.ready()` callback met `storeReadyRef.current = true`
- `handleNativePurchase` attend jusqu'a 8s que `storeReadyRef.current` soit vrai
- Ajoute retry sur `product.canPurchase` avant d'abandonner

### Problemes connus
- `.env` contient des liens Stripe en mode TEST (`buy.stripe.com/test_*`) — masques sur iOS
- IAP product IDs: `Standard_898` et `Premium_898` — configures dans App Store Connect
- Google Sign-In iOS : retire de l'app (Email/Password + Apple Sign-In uniquement)
- IAP soumission : premiere soumission d'abonnements doit se faire via l'interface App Store Connect (pas via API)
- Appwrite free tier : pas de backup auto (acceptable pour des cartes de visite)
- **CRITIQUE** : Ne jamais oublier `"ios": { "scheme": "https" }` dans `capacitor.config.json` — Appwrite bloque `capacitor://localhost`
