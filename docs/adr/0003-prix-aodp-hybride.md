# Prix du marché : API AODP en hybride

Les prix proviennent de l'API publique AODP (multi-items, multi-marchés, prix par qualité 1–5, CORS ouvert, ~180 req/min), en hybride avec des overrides manuels saisis par l'utilisateur.

Les overrides sont globaux (ils décrivent le marché, pas le personnage) et ne s'expirent jamais. Le TTL du cache est de 15 min, l'âge des prix est affiché en badge quand la donnée vient du cache, avec bouton d'actualisation manuelle.
