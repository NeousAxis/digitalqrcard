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
- **Build actuel**: 1.0 (65) — v1.0 SANS IAP, sans Firebase/Google
- **Status**: Build 65 — fix du bouton photo (input file desactive pour tous)

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

### Corrections appliquees — Build 62 (16 mai 2026)

**Strategie** : Shipper la v1.0 SANS abonnements IAP (modele valide sur Wise Weather App).
Apple bloquait l'entree avec les abonnements configures. Les abos reviendront en V2.

#### Fix 1: Feature flag `IAP_ENABLED` (src/App.jsx)
- Ajout de `const IAP_ENABLED = false;` juste apres l'objet `PRICING`
- `const effectivePlan = IAP_ENABLED ? subscription : 'pro'` → tous les utilisateurs ont
  l'acces complet (5 cartes, photo/logo, reseaux, infos entreprise), aucun paywall
- Tout le code IAP est **GATE, jamais supprime** : `PricingModal`, `PRICING`, useEffect
  StoreKit, `handleNativePurchase`, bouton Upgrade, badge plan, sync `pendingPlan`
- 12 points gates — un seul `IAP_ENABLED = true` reactive 100% des abonnements
- Sauvegardes V2 : branche git `v2-iap-full` + dossier `../\_IAP_V2_BACKUP/` + `IAP_BACKUP.md`

#### Fix 2: Abonnements retires d'App Store Connect
- Abonnements `Standard_898` + `Premium_898` + groupe `Abonnement DigitalQrCard` supprimes
- Recreation V2 entierement documentee dans `IAP_BACKUP.md` (racine du repo)

#### Fix 3: Locale primaire corrigee
- La locale primaire ASC etait `en-GB`, avec URLs privacy/support pointant par erreur vers
  `wise-weather-app.web.app` (mauvais projet) → rejet garanti
- Locale primaire basculee sur `en-US` ; locale `en-GB` supprimee

#### Fix 4: Pages privacy/support
- `public/privacy.html` + `public/support.html` nettoyees (zero mention IAP/abonnement,
  Firebase→Appwrite corrige)
- Deployees sur https://www.digitalqrcard.xyz via `vercel --prod` (liaison Git→Vercel HS)
- URLs ASC (privacy + support, en-US + fr-FR) repointees sur `digitalqrcard.xyz`

#### Fix 5: Reviewer notes ASC
- Notes reecrites : compte demo `demo@digitalqrcards.review` / `DemoReview2026!`
- Mention explicite : "This version (1.0) does NOT include any In-App Purchases"

#### Notes infra (pieges rencontres)
- **Appwrite free tier se met EN PAUSE apres inactivite** → restaurer le projet sur
  cloud.appwrite.io avant toute soumission/review Apple, sinon l'app est cassee
- `src/appwriteClient.js` n'etait pas commite → build Vercel casse ; desormais tracke
- Liaison GitHub→Vercel morte → deployer via `npx vercel --prod` (cf. DEPLOYMENT_GUIDE.md)
- Plugin `cordova-plugin-purchase` 13.13.1 : plus de `FileUtility.h`, le fix d'import
  `Foundation.h` apres `cap sync` est OBSOLETE
- ⚠️ Ne PAS lancer `/simplify` sur le code IAP gate : il est volontairement "inactif"
  mais doit etre conserve pour la V2

### Corrections appliquees — Build 63 (18 mai 2026)

**Rejet Build 62** : Guideline 2.1(a) login error + 2.1(b) IAP + 3.1.2(c) EULA.

**VRAIE CAUSE enfin identifiee** : la base Appwrite n'avait JAMAIS eu de schema.
Les collections `users` et `cards` existaient mais sans leurs attributs (migration
build 57 incomplete). L'app ne pouvait rien lire/ecrire → echec a la 1re operation
de donnees apres login. C'est la cause reelle de TOUS les rejets "App Completeness"
depuis le build 57 — aucun fix precedent ne pouvait marcher.

#### Fix 1: Schema Appwrite recree (LA correction critique)
- Script `scripts/setup-appwrite-schema.py` : cree tous les attributs des
  collections `users` (6) et `cards` (17) + index `idx_user_id` / `idx_card_order`
- Ancien attribut `cards.userId` (camelCase, REQUIS) passe en non-requis — il
  bloquait la creation de documents (le code ecrit `user_id` en snake_case)
- Verifie E2E reel : login + creation de carte OK (carte ecrite dans Appwrite)

#### Fix 2: Keep-alive Appwrite (anti-pause)
- `.github/workflows/appwrite-keepalive.yml` : ping toutes les 3h via GitHub Actions
- Empeche le free tier Appwrite de se mettre en pause pendant la review Apple
- 100% gratuit, aucune dependance Google

#### Fix 3: Firebase/Google retire (demande utilisateur)
- `@capacitor-firebase/authentication` desinstalle ; `GoogleService-Info.plist`
  supprime ; scheme URL Google + `GIDClientID` retires d'`Info.plist`
- Auth iOS = email/mot de passe uniquement (Appwrite). Apple Sign-In retire
  (non requis tant qu'aucun login tiers n'est propose)

#### Fix 4: IAP retire du binaire (Guideline 2.1b)
- `cordova-plugin-purchase` desinstalle ; capability `com.apple.InAppPurchase`
  retiree du `project.pbxproj`
- Le code IAP JS reste gate par `IAP_ENABLED=false` (cf. `IAP_BACKUP.md` pour la V2)

#### Cle API Appwrite
- Une cle `server-admin` existe (scopes Databases) mais son secret n'est stocke
  nulle part (Appwrite ne l'affiche qu'a la creation). Pour re-administrer la base :
  creer une nouvelle cle API dans la console Appwrite (Settings -> API Keys).

### Corrections appliquees — Build 64 (19 mai 2026)

**Rejet Build 63** : Guideline 2.1(a) "unable to access the app, unspecified error"
(iPad Air M4 + iPhone 17 Pro Max) + 3.1.2(c) lien EULA.

**LA VRAIE CAUSE de TOUS les rejets depuis le build 57** (reproduite sur simulateur) :
l'app iOS tournait sous l'origine `capacitor://localhost`, et **Appwrite rejette ce
schema** ("Invalid Scheme"). Donc aucun login ne marchait sur iOS — alors que ça
marchait en navigateur desktop (d'ou les fausses validations precedentes).

#### Fix 1: schema iOS Capacitor (LE correctif)
- `capacitor.config.json` : la cle etait `"ios": { "scheme": "https" }` — **mauvaise cle
  Capacitor, totalement ignoree**. Le "fix build 59" n'a donc jamais rien fait.
- Cle correcte = `server.iosScheme`. Et `https` n'est pas utilisable (schema reserve iOS).
- Valeur retenue : `"server": { "iosScheme": "appwrite-callback-69c62a550031e83fd11e" }`
  → l'app tourne sous `appwrite-callback-<projectId>://localhost`, schema explicitement
  accepte par Appwrite (cf. son message d'erreur).
- **Verifie sur simulateur iPad Air 11"** : login + creation/lecture/suppression de
  carte fonctionnent (auto-test "IOSTEST OK").

#### Fix 2: lien EULA (Guideline 3.1.2c)
- Lien standard Apple EULA + mention "no in-app purchases" ajoutes a la description
  App Store (en-US + fr-FR).

#### Methode de verification (a refaire pour toute future soumission)
- NE PAS se fier au test navigateur desktop : il ne reproduit pas le WKWebView iOS.
- Builder pour le simulateur (`xcodebuild -sdk iphonesimulator`), installer via
  `xcrun simctl`, et tester reellement login + donnees.

### Corrections appliquees — Build 65 (19 mai 2026)

**Rejet Build 64** : Guideline 2.1(a) — "when tapped to add a photo, nothing happened".
(2.1a login et 3.1.2c EULA = RESOLUS au build 64.)

**Cause** : le `<input type="file">` du selecteur de photo avait
`disabled={subscription === 'free'}`. Comme l'IAP est desactive, `subscription`
vaut `'free'` pour TOUS les utilisateurs → l'input etait desactive pour tout le
monde → taper la photo ne faisait rien. Oubli du gating IAP (le `disabled` n'avait
pas ete mis a jour avec les autres `IAP_ENABLED && ...`).

#### Fix (src/App.jsx, composant editeur de carte)
- Retrait de l'attribut `disabled` de l'input file (l'app etant gratuite, la photo
  est toujours accessible).
- Cercle "+ Photo" : `<div onClick={...click()}>` remplace par un `<label htmlFor>`
  natif — declenchement fiable du selecteur dans WKWebView (le `.click()` JS sur un
  input cache est peu fiable sur iOS).
- Input file : `display:none` remplace par un style "visuellement masque mais present".
- Label "Upload Photo / Logo" : retrait des styles bases sur `subscription`.

#### Info.plist
- Ajout de `NSPhotoLibraryUsageDescription` (acces photos pour la photo de carte).
- `NSCameraUsageDescription` corrige (texte exact : prise de photo, pas "scan QR").
- Localisations EN + FR mises a jour (`en.lproj` / `fr.lproj` InfoPlist.strings).

### Problemes connus
- `.env` contient des liens Stripe en mode TEST (`buy.stripe.com/test_*`) — masques sur iOS
- IAP product IDs: `Standard_898` et `Premium_898` — configures dans App Store Connect
- Google Sign-In iOS : retire de l'app (Email/Password + Apple Sign-In uniquement)
- IAP soumission : premiere soumission d'abonnements doit se faire via l'interface App Store Connect (pas via API)
- Appwrite free tier : pas de backup auto (acceptable pour des cartes de visite)
- **CRITIQUE** : `capacitor.config.json` DOIT contenir
  `"server": { "iosScheme": "appwrite-callback-69c62a550031e83fd11e" }`.
  Sans ça l'app tourne sous `capacitor://localhost` et Appwrite bloque tout login
  ("Invalid Scheme"). ⚠️ La cle est `server.iosScheme` — PAS `ios.scheme` (ignoree).
  `https` ne marche pas (schema reserve iOS) : utiliser le schema `appwrite-callback-*`.
