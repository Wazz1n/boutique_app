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

// --- Suivi de l'activité réseau -------------------------------------------
// Compte les requêtes en cours et prévient les composants abonnés (la barre de
// progression en haut de l'écran s'en sert). Le compteur est remis à jour dans
// un `finally` : même si une requête échoue, il redescend toujours.
let requetesEnCours = 0
const ecouteursReseau = new Set()

function signaler() {
  ecouteursReseau.forEach((rappel) => rappel(requetesEnCours))
}

export function surActiviteReseau(rappel) {
  ecouteursReseau.add(rappel)
  return () => {
    ecouteursReseau.delete(rappel)
  }
}

async function appelApi(chemin, options = {}) {
  requetesEnCours += 1
  signaler()
  try {
    let reponse
    try {
      reponse = await fetch(`${API_URL}${chemin}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
      })
    } catch {
      // fetch ne rejette que si le serveur est injoignable (pas de réseau, serveur éteint...)
      const erreurReseau = new Error('Connexion au serveur impossible. Vérifiez votre connexion internet.')
      erreurReseau.status = 0
      throw erreurReseau
    }

    if (!reponse.ok) {
      const corps = await reponse.json().catch(() => ({}))
      const erreur = new Error(corps.erreur || 'Une erreur est survenue')
      erreur.status = reponse.status // permet à l'appelant de réagir (ex : 401 = session expirée)
      throw erreur
    }

    return await reponse.json()
  } finally {
    requetesEnCours -= 1
    signaler()
  }
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
