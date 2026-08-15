const fr = {
  'app.name': 'Albion52',

  'browser.title': "Sélection de l'item",
  'browser.breadcrumb.all': 'Tout',
  'browser.tier': 'Tier',
  'browser.enchant': 'Enchant',
  'browser.quality': 'Qualité',
  'browser.quality.ev': 'EV',
  'browser.quality.q': 'Q{q}',
  'browser.reset': '↺ Reset',
  'browser.kind.raw': 'ressource',
  'browser.kind.refined': 'raffiné',
  'browser.kind.craft': 'fabriqué',

  'verdict.profitable': 'Rentable',
  'verdict.notProfitable': 'Pas rentable',
  'verdict.silverPerHour': 'Silver / heure',
  'verdict.total': '{verdict} — {profit} total pour {qty} unités',
  'verdict.perUnit': 'Profit / unité',
  'verdict.duration': 'Durée',
  'verdict.craftCheaper': 'craft < acheter',
  'verdict.buyCheaper': 'achat < craft',

  'tiles.cost': 'Coût',
  'tiles.revenue': 'Revenu',
  'tiles.profit': 'Profit',
} as const;

export type Messages = typeof fr;
export { fr };
