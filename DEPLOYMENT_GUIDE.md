# Guide de Déploiement & Résolution des Problèmes Vercel

Ce document explique comment gérer les déploiements de l'application DigitalQRCard sur Vercel, en particulier lorsque la synchronisation automatique échoue.

## 1. Déploiement Automatique (Méthode Standard)

Normalement, **toute modification** poussée sur la branche `main` de GitHub déclenche automatiquement une mise à jour sur Vercel.

**Commande habituelle :**
```bash
git add .
git commit -m "Description des changements"
git push
```

### Vérifier le statut
Une fois le `git push` effectué :
1.  Allez sur votre tableau de bord Vercel.
2.  Vérifiez que le dernier "Deployment" est en cours (Building) ou terminé (Ready).
3.  Si le statut reste bloqué ou si le site ne se met pas à jour, passez à la méthode manuelle.

---

## 2. Déploiement Manuel (Méthode de Force)

Si la liaison GitHub -> Vercel ne fonctionne pas (délais, bugs, blocages), vous pouvez forcer le déploiement directement depuis votre terminal local. C'est la solution de secours ultime.

**Commande à exécuter dans le dossier du projet :**

```bash
npx vercel --prod
```

*   Le système vous demandera peut-être de confirmer le projet (Appuyez sur `Entrée`).
*   Il construira l'application localement ou sur les serveurs de Vercel (selon la configuration) et forcera la mise à jour de l'URL de production.

**Résultat :**
Vous verrez un message `✅  Production: https://...` confirmant que la nouvelle version est en ligne.

---

## 3. Problèmes de Cache (Favicon, Ancienne Version)

Si vous avez déployé mais que vous voyez toujours l'ancienne version ou l'ancien logo :

1.  **Service Worker (PWA)** : Les navigateurs mobiles et Chrome gardent l'application en cache de manière agressive.
    *   **Solution** : Ouvrez le site en **Navigation Privée**. Si les changements sont visibles, votre code est bon, c'est juste le navigateur de l'utilisateur qui doit se mettre à jour (ce qui se fait souvent automatiquement après redémarrage du navigateur).

2.  **Forcer le Favicon** :
    *   Renommez le fichier du favicon (ex: `logo-icon.png` au lieu de `favicon.png`).
    *   Ajoutez un paramètre de version dans le HTML : `href="/logo-icon.png?v=2"`.

---

## 4. Sécurité Critique : Fichiers d'environnement

**NE JAMAIS COMMITER LE FICHIER `.env` OU DES CLÉS DE SERVICES.**

Le projet utilise un fichier `.env` local pour stocker les clés API (Firebase, Stripe, etc.). Ce fichier est listé dans le `.gitignore` et ne doit jamais apparaître sur GitHub.

### En cas de fuite accidentelle :
1.  Utilisez `git rm --cached .env` pour arrêter le suivi.
2.  Purgez l'historique complet avec `git filter-branch` ou `git-filter-repo`.
3.  **Régénérez immédiatement** toutes les clés compromises dans les consoles Firebase/Google Cloud et Stripe.

---

## Résumé des Commandes Utiles

| Action | Commande |
| :--- | :--- |
| **Pousser sur GitHub** | `git push` |
| **Forcer le Déploiement** | `npx vercel --prod` |
| **Lancer le serveur local** | `npm run dev` |

---

## Historique des Versions

### V1.0.0 (Officielle) - 04/01/2026
- **QR Code :** Refonte complète pour un affichage carré plein écran optimisé pour le scan.
- **Design :** Ajout du thème "Deep Forest" et ajustement dynamique de l'interface en mode partage.
- **Abonnements :** Intégration complète Stripe avec annulation directe via API.
- **Release :** Tag GitHub officiel `v1.0.0`.

### V1.0.1 - 04/01/2026
- **UI UX :** Amélioration intelligente du layout des boutons d'actions (Smart Grid).
  - 1 à 4 boutons : Alignés sur une seule ligne.
  - 5 boutons : Disposition en quinconce (3 en haut, 2 centrés en bas).
  - 6+ boutons : Grille structurée de 3 colonnes.

### V1.0.2 (Sécurité & Correction Sociale) - 05/02/2026
- **vCard Fix :** Les réseaux sociaux sont désormais encodés en `URL` (cliquables) au lieu de `X-SOCIALPROFILE`.
- **Sécurité :** Nettoyage complet de l'historique Git pour effacer les clés `.env`.
- **Abonnements :** Nouveau flux de confirmation "Account Required" avant le login.
- **PWA :** Système d'auto-update toutes les 30 secondes.

