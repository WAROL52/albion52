# Albion52

App web PWA, mobile-first, qui calcule la rentabilité du craft dans Albion Online (MVP), avec pour vision un dashboard économique tout-en-un (craft, gathering, merchant, ledger). Zéro base de données : persistance locale du navigateur, prix du marché via l'API publique AODP, recettes et noms d'items issus d'un dataset statique embarqué.

## Language

**Profil**:
Le contexte d'un personnage joué : nom, serveur, marché de base, frais de station par défaut, toggle focus. Les favoris lui appartiennent.
_Avoid_: compte, personnage, alt

**Serveur**:
Le cluster de jeu Albion (West, Asia, Europe) dans lequel le joueur évolue ; il détermine l'origine des prix du marché.
_Avoid_: région, monde

**Marché**:
Un endroit où s'échangent des ordres d'achat et de vente : les cinq villes royales, Caerleon, le Black Market, et Brecilien.
_Avoid_: ville (une ville est un marché particulier, pas un concept distinct)

**Item**:
Un objet craftable identifié par son nom unique (T4_BAG, T4_METALBAR…), ses variantes d'enchantement (@1/@2/@3) et ses niveaux de qualité (1–5).

**Recette**:
L'ensemble des ingrédients et quantités, du temps de craft et du coût de focus nécessaires à la production d'un item. Il existe des recettes de base, d'enchantement, d'artefact, de raffinage et de transmutation.

**Coût de craft**:
La somme des ingrédients valorisés au prix du marché, des frais de station, du journal et des taxes.
_Avoid_: coût de production, prix de revient

**Frais de station**:
Le pourcentage prélevé par une station publique sur le coût de base d'un craft. Une station personnelle (île) est gratuite.

**Focus**:
Ressource quotidienne qui améliore le taux de retour de ressources d'un craft.

**Retour de ressources**:
Le taux, avec ou sans focus, auquel les ressources consommées sont rendues après un craft.

**Journal**:
Un objet consommé par les crafts pour remplir les journaliers ; son coût est intégré au coût de craft.

**Override**:
Un prix du marché saisi manuellement par l'utilisateur. Global (partagé entre profils), il ne s'expire jamais et remplace le prix automatique.
_Avoid_: prix manuel, correction

**Prix par qualité**:
Le prix d'un item pour chaque niveau de qualité (1–5). La base du calcul de valeur attendue.

**Valeur attendue**:
Le profit espéré d'un craft, pondéré par les probabilités de qualité. C'est le chiffre affiché par défaut.
_Avoid_: profit moyen, espérance

**Silver/heure**:
Le profit attendu d'un craft rapporté au temps de craft réel de sa recette. KPI de décision principal.

**Marge craft vs acheter**:
L'écart entre le coût de production d'un item et son prix d'achat direct au marché.

**Source d'approvisionnement**:
La manière d'obtenir un item : acheter au marché, crafter, ou récolter. Chaque famille a une source par défaut (raw→récolte, raffiné→craft, craft→achat).
_Avoid_: méthode d'acquisition, provenance

**Épingle de source**:
Un choix explicite de l'utilisateur pour une famille (`{ source, enabled: true }`) ; il bat les défauts et l'héritage. Les entrées non épinglées du SourceConfig ne sont pas autoritaires.
_Avoid_: préférence, réglage de source

**Propagation de source**:
La règle d'application récursive des choix de source à travers l'arbre d'ingrédients : `none` (par famille), `parent` (les enfants sans épingle héritent du parent), `all` (la source de l'item racine s'applique à tout l'arbre).

**Contexte de source**:
Le paramètre du seam de calcul portant config, propagation, source parente et source racine ; injectable explicitement dans `compute`/`computeRecipe`/`computeIngredient`, sinon repli sur l'état global.

**Sens de marché**:
La politique d'exécution des ordres : par défaut, achat instantané pour les ressources, vente instantanée pour le produit fini. Réglable par profil.
_Avoid_: mode de trading, stratégie de prix

**Dataset statique**:
L'inventaire embarqué des recettes et des noms d'items, versionné, disponible hors-ligne. Source de la recherche d'items.

**Cache prix**:
Les derniers prix connus pour un (item, qualité, marché), susceptibles d'être périmés ; l'âge est affiché. Source de repli hors-ligne.

**Tranche**:
Une unité post-MVP du roadmap : classement, or/€, merchant, gathering, ledger.
