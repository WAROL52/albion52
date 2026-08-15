# Modèle de calcul : valeur attendue, coût complet

Le calcul de rentabilité utilise la valeur attendue : profit pondéré par les probabilités de qualité (table communautaire en dur) appliquées aux prix par qualité. Le modèle de coût est complet : ressources, frais de station, focus, retour de ressources, journal, taxes de marché.

Le silver/heure utilise le temps de craft réel de la recette (`@time` du dataset). Le sens de marché par défaut est conservateur (achat instantané / vente instantanée), réglable par profil. Alternatives rejetées : Monte Carlo et affichage de la distribution des qualités (n'ont jamais changé une décision, bruit visuel pour le MVP).
