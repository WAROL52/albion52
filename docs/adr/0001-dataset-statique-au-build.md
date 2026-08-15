# Dataset statique embarqué au build

L'API AODP ne fournit ni recettes de craft, ni noms d'items (vérifié en live, 2026-08-15). Nous embarquons donc un dataset statique généré au build depuis les fichiers du jeu (`ao-data/ao-bin-dumps`) : recettes complètes (base, enchantements @1/@2/@3, artefacts, raffinage, transmutation), temps de craft, coût de focus, et noms localisés FR + EN.

Alternatives rejetées : recettes saisies à la main (fragile, pénible), dataset complet 24 Mo (inutile pour le MVP). Les autres langues de localisation (13 restantes) s'ajoutent par simple régénération.
