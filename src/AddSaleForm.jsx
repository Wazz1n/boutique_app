import { useState, useEffect } from 'react'
import GlassCard from './components/GlassCard.jsx'
import { boutonPrimaire, boutonRetour } from './components/boutonStyles.js'
import { api } from './api.js'

// Formulaire simple : un produit + une quantité, en attendant un vrai panier
// multi-articles (v2). Ça couvre déjà le cas d'usage principal : une vente = un article.

export default function AddSaleForm({ onFerme, onVenteEnregistree }) {
  const [produits, setProduits] = useState([])
  const [produitId, setProduitId] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    api.getProduits().then(setProduits).catch(() => setErreur('Impossible de charger les produits'))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!produitId || quantite < 1) {
      setErreur('Choisissez un produit et une quantité valide')
      return
    }
    setEnCours(true)
    setErreur('')
    try {
      await api.creerVente([{ produitId: Number(produitId), quantite: Number(quantite) }])
      onVenteEnregistree()
      onFerme()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-rose-950/20 px-4 z-30">
      <GlassCard className="w-full max-w-sm bg-white/70">
        <h2 className="text-base font-medium text-rose-950 mb-4">Ajouter une vente</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <select
            value={produitId}
            onChange={(e) => setProduitId(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm text-rose-950"
          >
            <option value="">Choisir un produit</option>
            {produits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} — {p.prixVente.toLocaleString('fr-FR')} Ariary ({p.quantiteStock} en stock)
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm text-rose-950"
          />

          {erreur && <p className="text-xs text-rose-600">{erreur}</p>}

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onFerme} className={`flex-1 ${boutonRetour}`}>
              ← Retour
            </button>
            <button type="submit" disabled={enCours} className={`flex-1 ${boutonPrimaire} disabled:opacity-60`}>
              {enCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
