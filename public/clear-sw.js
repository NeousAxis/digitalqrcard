// Auto-Update Service Worker Registration pour DigitalQRCard
// Ce script enregistre le SW et gère les mises à jour automatiques

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('[SW] Service Worker registered successfully');

                // Vérifier les mises à jour toutes les 30 secondes
                setInterval(() => {
                    registration.update();
                }, 30000);

                // Écouter les mises à jour
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[SW] New version found, updating...');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nouvelle version disponible, forcer le refresh
                            console.log('[SW] New version installed, reloading page...');

                            // Afficher un message à l'utilisateur (optionnel)
                            if (confirm('Une nouvelle version est disponible. Recharger maintenant ?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            } else {
                                // Si l'utilisateur refuse,on force quand même après 5 secondes
                                setTimeout(() => {
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    window.location.reload();
                                }, 5000);
                            }
                        }
                    });
                });
            })
            .catch((error) => {
                console.log('[SW] Service Worker registration failed:', error);
            });

        // Navigateur reprend le contrôle quand un nouveau SW est activé
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[SW] Controller changed, reloading...');
            window.location.reload();
        });
    });
}
