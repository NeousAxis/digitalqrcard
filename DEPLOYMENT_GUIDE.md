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
