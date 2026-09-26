// Données de démonstration pour le prototype.
// Plus tard, ces valeurs viendront d'un appel à l'API Flask (fetch vers /api/dashboard),
// mais pour le prototype de demain, on les code en dur ici — ça permet de montrer
// l'interface sans avoir besoin du backend fini.

export const resume = {
  chiffreAffaires: 1240000,
  chiffreAffairesMoisDernier: 1050000,
  nombreVentes: 86,
  produitsStockFaible: 3,
}

export const historiqueCA = [
  { mois: 'Avr', valeur: 820000 },
  { mois: 'Mai', valeur: 910000 },
  { mois: 'Juin', valeur: 875000 },
  { mois: 'Juil', valeur: 980000 },
  { mois: 'Août', valeur: 1050000 },
  { mois: 'Sept', valeur: 1240000 },
]

export const ventesRecentes = [
  { id: 1, produit: 'Robe fleurie, taille M', prix: 45000, quandTexte: 'Il y a 2 jours' },
  { id: 2, produit: 'Sac à main beige', prix: 62000, quandTexte: 'Il y a 3 jours' },
  { id: 3, produit: 'Sandales dorées', prix: 38000, quandTexte: 'Il y a 4 jours' },
]
