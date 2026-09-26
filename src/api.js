// Toutes les requêtes vers le backend passent par ici — un seul endroit à modifier
// le jour où l'URL change (dev -> Render en production).
// credentials: 'include' est indispensable : c'est ce qui permet au navigateur
// d'envoyer le cookie de session créé par /api/login à chaque requête suivante.

// En dev, VITE_API_URL pointe vers http://localhost:5000 (backend séparé).
// En production, le frontend est servi PAR Flask lui-même (même origine),
// donc on veut des requêtes relatives ('/api/...').
//
// Pour ne plus dépendre d'un fichier .env qui refuse parfois de se charger
// correctement (problème rencontré en dev) : si VITE_API_URL n'est pas
// défini ET qu'on tourne sur le port par défaut de Vite (5173), on devine
// automatiquement que le backend est sur localhost:5000. Sinon (production,
// ou port différent), on reste en relatif.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5000' : '')

async function appelApi(chemin, options = {}) {
  const reponse = await fetch(`${API_URL}${chemin}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!reponse.ok) {
    const erreur = await reponse.json().catch(() => ({}))
    throw new Error(erreur.erreur || 'Une erreur est survenue')
  }

  return reponse.json()
}

export const api = {
  login: (motDePasse) =>
    appelApi('/api/login', { method: 'POST', body: JSON.stringify({ motDePasse }) }),

  verifierSession: () => appelApi('/api/session'),

  logout: () => appelApi('/api/logout', { method: 'POST' }),

  getDashboard: () => appelApi('/api/dashboard'),

  getProduits: () => appelApi('/api/produits'),

  creerProduit: (produit) =>
    appelApi('/api/produits', { method: 'POST', body: JSON.stringify(produit) }),

  ajouterStock: (produitId, quantite) =>
    appelApi(`/api/produits/${produitId}/stock`, {
      method: 'POST',
      body: JSON.stringify({ quantite }),
    }),

  supprimerProduit: (produitId) =>
    appelApi(`/api/produits/${produitId}`, { method: 'DELETE' }),

  getMouvements: () => appelApi('/api/mouvements'),

  annulerMouvement: (mouvementId) =>
    appelApi(`/api/mouvements/${mouvementId}/annuler`, { method: 'POST' }),

  annulerVente: (venteId) => appelApi(`/api/ventes/${venteId}`, { method: 'DELETE' }),

  getVentes: () => appelApi('/api/ventes'),

  creerVente: (lignes) =>
    appelApi('/api/ventes', { method: 'POST', body: JSON.stringify({ lignes }) }),
}
