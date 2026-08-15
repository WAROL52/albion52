# PWA offline-first, politique réseau network-first

L'app est installable (PWA, vite-plugin-pwa) et doit tourner hors-ligne sur mobile. Le service worker précache l'app shell et le dataset statique, et applique une politique network-first aux prix AODP : frais quand le réseau est disponible, fallback sur le cache sinon, avec refresh automatique des prix périmés dès le retour en ligne.

Le dataset est versionné pour que les mises à jour de données se propagent proprement via la mise à jour du service worker.
