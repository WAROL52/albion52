# Pas de base de données : zustand + localStorage

L'app est 100% côté navigateur : pas de backend, pas de base de données. L'état est porté par zustand, persistance via `zustand/middleware` (persist) dans localStorage, avec un schéma versionné et des migrations.

Le cache des prix est un store dédié (TTL, éviction LRU, badge d'âge). Quand la tranche « classement top crafts » (qui veut les prix en masse) arrivera, le cache migrera vers IndexedDB — pas avant.
