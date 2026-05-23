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
- **Build actuel**: v1.1 (72) — EN REVIEW (`WAITING_FOR_REVIEW`) depuis le 23 mai 2026
  (V2 : footer compact, look abricot + THÈME DYNAMIQUE, Apple Wallet, photo, icône QR,
  logo retiré du header). Release v1.1 = MANUELLE (publier via API après approbation).
- **v1.0 (65)**: ✅ PUBLIEE le 20 mai 2026, reste `READY_FOR_SALE` pendant la review v1.1
  (https://apps.apple.com/app/digital-qr-cards/id6758325036)
- **Compte demo App Review**: support@digitalqrcard.xyz / DemoReview2026! (3 cartes)

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

### Corrections appliquees — Resubmit Build 65 (20 mai 2026, metadata-only)

**Rejet du build 65** : 2.1(a) "we need to have a demo account with data" + 2.3.3
"screenshots do not show the actual app in use" (6.7" et 6.1" iPhone).

**Pas de nouveau binaire** — uniquement de la metadata + des donnees Appwrite.

#### Fix 1: Compte demo pre-rempli avec 3 cartes
- Script `scripts/seed_demo_cards.py` (idempotent) — cree dans Appwrite 3 cartes
  d'exemple sous le user `69c65913001ac2f25565` : Marie Dupont (Marketing Director,
  BrightLabs), Jean Martin (Software Engineer, Northbound Studio), Sophie Laurent
  (Architecte, Atelier Laurent).
- Reviewer notes mises a jour pour mentionner la pre-population.

#### Fix 2: Vrais screenshots (6.7", 6.5", 6.1") en-US + fr-FR
- Anciens screenshots = mockups marketing avec badge "PREMIUM" (qui n'existe plus
  dans l'app sans IAP) + layout qui ne correspondait pas a l'UI carrousel reelle.
- Nouveaux screenshots generes sur simulateurs iPhone (17 Pro Max -> resize pour
  6.7"/6.5", iPhone 17 Pro natif pour 6.1") : 3 ecrans par device class.
  - Dashboard avec la carte "Marie Dupont" en carrousel.
  - Vue partage QR.
  - Editeur de carte.
- Upload via API ASC : 18 screenshots (3 ecrans × 3 tailles × 2 locales). Anciens
  mockups supprimes des sets ASC.

#### Methode (pour reference future)
- Diagnostic temporaire (auto-login + cycling) inseree dans App.jsx puis retire,
  pour permettre la capture automatisee de plusieurs ecrans sans pilotage UI.
- `xcrun simctl io screenshot` capture le framebuffer du device sans dependre de
  la visibilite de la fenetre du Simulator.

### Corrections appliquées — Build 71 (1.1) — 23 mai 2026

Premier build de la V2 réellement soumis à l'App Store (la V2 était committée mais
jamais soumise).

#### Fix UI : footer trop grand qui cachait le bouton Save (rapporté par le user)
- `src/index.css` `.app-footer` : `min-height:100px` retiré, `padding-top` 15→8px,
  `padding-bottom` 30→8px (+safe area) ; `.footer-nav-item` padding 0.5→0.3rem.
  Footer ~135px → ~103px sur iPhone à encoche.
- `src/App.jsx` (fin du `<form>` éditeur) : spacer 80px →
  `calc(110px + env(safe-area-inset-bottom))` pour dégager Save sous le footer fixe.
- Vérifié navigateur (mobile) + simulateur : Save dégagé, ~40px de marge.

#### Soumission
- Captures **abricot** régénérées : les captures ASC étaient encore BLEUES (build 65) →
  mismatch 2.3.3 garanti. Set **iPad supprimé** (app iPhone-only).
- « Nouveautés » rempli (était vide — requis pour une MAJ).
- Audit metadata OK : le seul hit (`abonnement` fr-FR) est le disclaimer « sans
  abonnement » (sûr). 0 IAP / 0 abonnement côté ASC.
- Soumis → `WAITING_FOR_REVIEW`. Remplacé par le build 72 avant prise en review.

### Corrections appliquées — Build 72 (1.1) — 23 mai 2026

3 changements UI demandés par le user (sur capture device).

#### Fix 1 : logo retiré du header
- `src/App.jsx` : `.brand-icon-pro` (img `/logo-icon.png`) supprimé ; il ne reste que le
  titre `.brand-name-pro`. Le logo reste l'icône de l'app.

#### Fix 2 : icône partage → QR code
- Bouton d'action central : import `Share2` → `QrCode` (lucide) ; `<Share2>` → `<QrCode>`.
  L'état actif (QR affiché) reste un `<X>` pour fermer.

#### Fix 3 : thème dynamique — TOUT le chrome suit la couleur de la carte affichée
- `useEffect` dans `App()` pose `--primary` + `--primary-glow` sur **`document.documentElement`
  (:root)** depuis `themeToHex(carte active)` : carte du carrousel (`activeCardIndex`) en
  dashboard, `editingCard` en éditeur, sinon abricot `#EC6B3E`.
- ⚠️ Le footer est **hors de `.app-container`** → poser la var en inline sur `.app-container`
  ne l'atteint PAS. Il FAUT la poser sur `:root`.
- CSS passé en `var(--primary)` : `.brand-name-pro` (était un dégradé abricot en texte →
  `color`), `.btn-create-pro`, `.action-circle-btn.share` (+ hover `filter:brightness(.92)`),
  focus inputs. Wallet reste noir, edit/delete neutres (volontaire).
- Vérifié simulateur : carte bleue → app bleue, carte verte → app verte.

#### Remplacer un build DÉJÀ en review (réutilisable)
1. **Annuler** la reviewSubmission : `PATCH /v1/reviewSubmissions/{id}` `{canceled:true}`
   → la version repasse `DEVELOPER_REJECTED` (éditable).
2. Attacher le nouveau build : `PATCH /v1/appStoreVersions/{VID}/relationships/build`.
3. Remplacer captures + whatsNew, puis `fastlane submit` (reject_if_possible) → re-soumis.
- Si le build n'est pas encore pris en review, aucun temps de review perdu.

#### Méthode captures App Store (réutilisable — remplace l'ancienne note du build 65)
- Harnais TEMPORAIRE dans `src/App.jsx` (const `SHOT_MODE=true`, retiré via
  `git checkout src/App.jsx` après) : auto-login démo dans `checkAuth` + `useEffect` qui
  choisit l'écran via `localStorage.SHOT_SCREEN` incrémenté à chaque relance
  (0=dashboard, 1=QR, 2=éditeur). Commiter le code PROPRE d'abord, puis le harnais est jetable.
- Build simu : `xcodebuild -sdk iphonesimulator -derivedDataPath /tmp/dd_shot CODE_SIGNING_ALLOWED=NO`.
  `simctl status_bar override` (9:41, batterie 100) + relances `simctl launch/terminate` +
  `simctl io <udid> screenshot`.
- Capture sur **iPhone 17 Pro Max** (1320×2868) puis `sips -z` → 6.7"(1290×2796),
  6.5"(1242×2688), 6.1"(1179×2556). App **iPhone-only** (`TARGETED_DEVICE_FAMILY=1`) → pas
  d'iPad.
- Upload via API ASC (POST appScreenshots → PUT chunks `uploadOperations` → PATCH
  `uploaded`+md5). Scripts `/tmp/asc_*.py` (JWT helper du playbook). `assetDeliveryState`
  doit passer `COMPLETE` avant de soumettre.
- ⚠️ `simctl io screenshot` peut être en retard d'un frame vs l'état réel → vérifier les
  couleurs via `getComputedStyle` (eval navigateur), pas seulement à l'œil.

#### Compte démo (IMPORTANT — éviter un rejet 2.1)
- Le compte qui FONCTIONNE = `support@digitalqrcard.xyz` / `DemoReview2026!`.
  `demo@digitalqrcards.review` (cité dans de vieilles notes) **échoue au login** — ne
  jamais le mettre dans les reviewer notes.

### V2 (committee sur main) — SOUMISE App Store (build 71→72) le 23 mai 2026, EN REVIEW

**Pass Wallet — GROSSE photo + GROS nom via banniere `strip` (2026-05-22).** Le user
voulait photo ET nom « beaucoup plus grands ». Solution finale (endpoint only) :
- Style `storeCard` + on **compose nous-memes la banniere `strip`** (`api/wallet-pass.js`,
  `makeStrip` avec jimp) : gros avatar circulaire 340px a GAUCHE + nom en grand (Open Sans
  128px, fallback 64px si trop long) a DROITE, fond = couleur du theme. PAS de logo, PAS de
  champ nom Wallet (tout est dessine dans l'image) → aucun chevauchement, aucun doublon.
  Contraste auto : texte blanc sur fond fonce, noir sur fond clair (`lightBg`).
- ⚠️ PIEGE MAJEUR : le `strip` **ne s'affiche PAS dans le simulateur** (ni apercu ni meme
  apres ajout) → j'ai cru a tort que c'etait impossible. **Sur un VRAI iPhone, le strip se
  rend.** Toujours valider Wallet sur device reel, le simu ment sur les images de pass.
- ⚠️ Polices jimp : `Jimp.loadFont(Jimp.FONT_SANS_*)` ECHOUE sur Vercel (les .fnt/.png ne
  sont pas traces). FIX : copier les polices dans **`api/_fonts/`** (open-sans-128/64
  white+black) et les charger par chemin relatif (`fileURLToPath(import.meta.url)`) — la
  Vercel les bundle avec la fonction.
- @2x/@3x du strip = multiples EXACTS du 1x (375x144 / 750x288 / 1125x432) sinon Wallet
  jette l'image.
- Pour piloter le simu/Wallet en CLI (ajouter un pass) : `cliclick`, fenetre Simulator avec
  barre de titre ~77px. Mapping fb→ecran : `sx=winX+marge+propX*cw`,
  `sy=winY+77+propY*(winH-77)`. Le simu demande « Autoriser » (Safari) puis « Ajouter ».

**Build TestFlight 1.1 (70) — re-theme complet abricot (2026-05-22).**
- Logo aussi DANS l'app : l'en-tete utilisait un `<Smartphone>` lucide dans une boite
  bleue (`.brand-icon-pro`) → remplace par `<img src="/logo-icon.png">` (CSS : bg bleu
  retire, `overflow:hidden`, img cover). Import `Smartphone` retire.
- Toute l'UI passee du BLEU a l'ABRICOT/CORAIL pour coherence avec le logo :
  `--primary: #2563eb → #EC6B3E` (cascade sur tous les `var(--primary)`), `--primary-glow`,
  `.brand-name-pro` (texte), `.btn-create-pro` (bouton New Card), `.action-circle-btn.share`
  hover, focus inputs (rgba 56,189,248 → 236,107,62), + bleus inline App.jsx (#3b82f6,
  rgba 59,130,246, toast info rgba 37,99,235). Palette : primary `#EC6B3E`, hover `#D85A2E`,
  gradient `#EC6B3E→#F2854E`.
- Theme par defaut des NOUVELLES cartes : `pantone-classic-blue → pantone-peach-fuzz`
  (editeur, ligne ~809). Les cartes existantes gardent leur theme choisi (donnee user).
- ⚠️ Les couleurs de CARTE (banniere, accent) viennent du THEME de chaque carte
  (`THEME_COLORS`, choisi par carte) — PAS du chrome. Une carte demo en `classic-blue`
  reste bleue ; c'est normal, pas une incoherence du theme app.
- Verifie sur simulateur : header logo+nom abricot, boutons/onglets/partage corail.

**Build TestFlight 1.1 (69) — nouvelle icone + photo sur le pass (2026-05-22).**
- Nouveau logo fourni par le user : `../Digital Qr Card_LOGO/digital-qr-cards-icon-1024.png`
  (carte cream + avatar + QR sur fond abricot). Master 1024 a un canal alpha → APLATI
  (Apple interdit l'alpha sur l'icone). 15 tailles regenerees via PIL (`Image.convert('RGB')`
  → sans alpha) dans `AppIcon.appiconset` (memes noms, Contents.json inchange).
- Logo applique aussi : favicon web (`public/logo-icon.png` 512) + logo du pass Wallet
  (`api/_pass-assets.js` ICON_29/58/87 + LOGO_50/100 regeneres en base64 PNG via PIL) →
  les passes SANS photo montrent desormais le nouveau logo (plus le carre bleu).
- Pas d'ImageMagick sur la machine → utiliser **PIL** (`python3`, dispo) pour aplatir/resize.


**Build TestFlight 1.1 (67) — 2 bugs corriges le 2026-05-22** (rapportes par le user sur le
build 66). Les DEUX etaient PRE-EXISTANTS (pas causes par la V2) :
- **Bug pass Wallet vide** : les donnees d'une carte vivent dans `card.fields[]`
  (`{type,value}`), PAS en props directes. `handleAddToWallet` lisait `card.title/phone/...`
  (vides) → pass sans infos. Fix : extraire les champs depuis `card.fields[]` (map byType).
- **Bug photo non persistante** : (1) `handleSaveCard` n'ecrivait pas la photo ; (2)
  `fetchCards` ne la lisait pas ; (3) **Appwrite n'a AUCUN attribut `image`** (verifie :
  create avec `image` → `400 Unknown attribute`). Fix SANS cle API : la photo (compressee)
  est stockee dans la colonne `fields` existante (limite 50000) comme entree reservee
  `{type:'__photo', value:<dataURL>}`. `fetchCards` l'extrait vers `card.image` et la retire
  des champs editables ; `handleSaveCard` la re-injecte. Compression ADAPTATIVE (dimensions
  400→200, qualite 0.72→0.4) pour garantir que le dataURL tient sous ~44000 chars.
  - ⚠️ Si un jour on veut la pleine qualite : creer un attribut `image` (string ~5MB) OU
    un bucket Appwrite Storage (necessite une cle API serveur), puis basculer le stockage.
  - Verifie par aller-retour REEL sur Appwrite (compte demo) : photo identique au bit pres
    apres save→reload ; payload Wallet bien rempli. PAS verifie : le geste photo in-app.

**Build TestFlight 1.1 (66) uploade le 2026-05-22** (Wallet couleur + fix zoom, SANS IAP).
- Versions bumpees : `MARKETING_VERSION 1.0→1.1`, `CURRENT_PROJECT_VERSION 65→66` (pbxproj,
  Debug+Release) ET `CFBundleVersion 65→66` (Info.plist, code en dur).
- Upload via `cd ios/App && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 fastlane release` →
  `upload_to_app_store(submit_for_review: false)` = binaire sur ASC/TestFlight, **PAS de
  soumission review**. Build state VALID confirme via API ASC.
- ⚠️ NE PAS lancer `fastlane submit` (soumission App Store) sans accord EXPLICITE du user.
- ⚠️ Piege : ne PAS piper `fastlane release` dans `tail` (l'exit code devient celui de tail,
  pas de fastlane → faux positif). Verifier le succes via `fastlane/report.xml` (pas de
  `<failure>`) et/ou l'API ASC (`/v1/builds`, cf. `/tmp/asc_builds.mjs`).
- ⏳ Reste a confirmer par le user : test reel du build sur device via l'app TestFlight
  (couleur du pass selon theme + zoom non bloque).

**Feature Apple Wallet — FAITE et verifiee** (pass `.pkpass` s'ajoute au Wallet sur device) :
- Pass Type ID `pass.com.cyrilleger.digitalqrcardpro` (ASC id `7A8Q47SLQG`) + certificat
  de signature (ASC id `BZBU469H7F`). Materiel : `~/private_keys/pass/` (pass_cert.pem,
  pass.key, wwdr.pem, pass.p12 pw `dqcpass`) + base64 en env Vercel
  (`PASS_CERT_B64`, `PASS_KEY_B64`, `PASS_WWDR_B64`).
- Endpoint `api/wallet-pass.js` (lib `passkit-generator`) deploye sur Vercel
  (digitalqrcard.xyz). Genere+signe un pass (POST JSON ou GET `?d=<base64 carte>`).
  ⚠️ Vercel ne se deploie PAS via git push (liaison morte) → `npx vercel --prod --yes`.
- App : bouton « Add to Apple Wallet » sur chaque carte (gate `effectivePlan !== 'free'`),
  ouvre l'URL du pass via `@capacitor/browser` → feuille native iOS.
- ✅ Couleur du pass = couleur du THEME de la carte (FAIT le 2026-05-22) :
  - Helper `themeToHex(theme)` dans `src/App.jsx` (juste apres `THEME_COLORS`) : resout
    une cle de theme vers son hex primaire (1er hex du gradient), fallback classic-blue.
  - `handleAddToWallet` envoie `color: themeToHex(card.theme)` dans le payload du pass.
  - `api/wallet-pass.js` : `passColors(hex)` convertit hex→rgb, met `backgroundColor` =
    couleur du theme et **auto-contraste** le texte (foreground noir + label gris fonce
    sur fond clair `lum>=0.6`, sinon blanc) → lisible sur les themes pales (peach, rose).
  - `accentColor` (rendu carte) refactore pour reutiliser `themeToHex` (dedup /simplify).
  - Verifie sur simulateur (openurl du pass) : magenta→texte blanc, peach→texte fonce.
  - ⚠️ `scripts/seed-demo-cards.py` met des cles de theme INVALIDES (`forest-green`,
    `sunset-orange`) absentes de `THEME_COLORS` → ces 2 cartes demo retombent sur le bleu
    (rendu ET pass). Pour montrer une couleur, creer une carte avec un theme `pantone-*`.
- ✅ Photo + agencement du pass (FAIT le 2026-05-22, build 68) — design choisi par le user
  « comme sur la carte de visite » : avatar haut-gauche + nom a cote + QR en bas.
  - `handleAddToWallet` genere une vignette JPEG ~200px (`makePassThumb`, base64<=18000
    pour rester sous la limite d'URL Vercel ~24KB) et l'envoie en `&p=`.
  - `api/wallet-pass.js` (`makeAvatar`, lib `jimp`) : convertit le JPEG en PNG (Wallet
    REFUSE le JPEG), center-crop, fait un **avatar circulaire** = `logo.png` (50/100/150,
    coins transparents) ET un carre = `icon.png` (29/58/87). Le nom passe en `logoText`.
    ⚠️ @2x/@3x DOIVENT etre des multiples EXACTS du 1x sinon Wallet jette l'image en
    silence. `makeAvatar` renvoie null sur erreur (le pass ne casse jamais).
  - Champs : title+company en secondary, phone+email en auxiliary, website+location en
    back. PAS de headerFields (ils masqueraient une eventuelle vignette). QR = barcode bas
    (position FIXE imposee par Apple, non deplacable).
  - ⚠️ PIEGES Apple Wallet appris a la dure :
    - La feuille « Add to Wallet » affiche l'**icone de l'app editrice** en haut-gauche,
      PAS le `logo.png` du pass (verifie sur simu neuf). La photo (logo) n'apparait que
      sur le pass REEL une fois AJOUTE dans Wallet. Donc impossible de la voir dans
      l'apercu openurl ; il faut ajouter le pass (tap « Ajouter ») pour la voir.
    - Le logo est plafonne ~50pt → l'avatar est PETIT, pas grand comme sur la carte.
    - Le pass n'est PAS un canvas libre (gabarit fixe). On ne peut pas reproduire une
      maquette custom (ex. QR en bas-droite : impossible).
  - Verifie au niveau FICHIER (curl + inspection pixels) : avec `&p=`, `logo.png` = avatar
    rond, `icon.png` = carre. PAS verifie visuellement dans Wallet (tap non automatisable
    de facon fiable en CLI) → a confirmer sur device avec une carte qui A une photo.
  - ⚠️ Build 67 n'a PAS `makePassThumb` (ajoute apres) → la photo n'arrive sur le pass
    qu'a partir du build 68. Et seule une carte AVEC photo l'affiche (pas les cartes demo).

**Abonnements (IAP) — PAS refaits, en attente** : B1 (`IAP_ENABLED=true` + reinstaller
`cordova-plugin-purchase` + capability + disclosures abo), B2 (recreer abos dans ASC,
cf. IAP_BACKUP.md), C (build 1.1 + soumission). Le user veut Wallet en perk premium.

### BUG zoom bloque — ✅ CORRIGE le 2026-05-22
- Symptome : taper dans un champ zoomait l'app (auto-zoom iOS au focus d'un input
  font-size < 16px) sans possibilite de dezoomer.
- Fix (les deux, pour robustesse) :
  - `index.html` : viewport `maximum-scale=1.0, user-scalable=no` (garde-fou — bloque
    tout zoom donc tout blocage).
  - `src/index.css` : regle globale `input, textarea, select { font-size: 16px }` qui
    traite la cause racine (empeche l'auto-zoom au focus, garde le pinch ailleurs).
- ⏳ Reste a confirmer par TOI le geste pinch sur device reel (non automatisable en CLI :
  pas d'API tap simctl). Les 2 correctifs sont presents dans le bundle iOS (verifie).

### Test device
- App installee en debug sur l'iPhone reel (« iPhone Neous », iPhone 14 Pro, UDID
  `00008120-00090C861193C01E`) via signature auto (`xcodebuild -allowProvisioningUpdates`
  + cle API ASC) puis `xcrun devicectl device install app`.

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
