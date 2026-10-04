import { useState, useEffect, useRef } from 'react'
import Modale from './components/Modale.jsx'
import { boutonPrimaire, boutonRetour } from './components/boutonStyles.js'
import { api } from './api.js'
import { notifier } from './toasts.js'

// Formulaire simple : un produit + une quantité, en attendant un vrai panier
// multi-articles (v2). Ça couvre déjà le cas d'usage principal : une vente = un article.

const CHAMP =
  'rounded-xl border border-white/10 bg-black/45 px-3 py-2.5 text-sm text-rose-50'

export default function AddSaleForm({ onFerme, onVenteEnregistree }) {
  const [produits, setProduits] = useState([])
  const [produitId, setProduitId] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  // Verrou SYNCHRONE contre le double envoi : l'état `enCours` ne se met à jour qu'au
  // prochain affichage, trop tard si deux envois partent coup sur coup.
  const verrou = useRef(false)

  useEffect(() => {
    api.getProduits().then(setProduits).catch(() => setErreur('Impossible de charger les produits'))
  }, [])

  const produitChoisi = produits.find((p) => String(p.id) === String(produitId))
  const quantiteNombre = Number(quantite)
  const total = produitChoisi && quantiteNombre > 0 ? produitChoisi.prixVente * quantiteNombre : 0

  async function handleSubmit(e, fermer) {
    e.preventDefault()
    if (!produitChoisi || !Number.isInteger(quantiteNombre) || quantiteNombre < 1) {
      setErreur('Choisissez un produit et une quantité valide')
      return
    }
    if (quantiteNombre > produitChoisi.quantiteStock) {
      setErreur(`Stock insuffisant : il n'en reste que ${produitChoisi.quantiteStock}`)
      return
    }

    if (verrou.current) return
    verrou.current = true
    setEnCours(true)
    setErreur('')
    try {
      await api.creerVente([{ produitId: produitChoisi.id, quantite: quantiteNombre }])
      notifier('Vente enregistrée')
      onVenteEnregistree()
      // On ne réactive PAS le bouton : la fenêtre se ferme, et un deuxième clic
      // pendant l'animation de sortie créerait une vente en double.
      fermer()
    } catch (err) {
      setErreur(err.message)
      verrou.current = false
      setEnCours(false)
    }
  }

  return (
    <Modale onFerme={onFerme}>
      {({ fermer }) => (
        <>
          <h2 className="mb-4 text-base font-medium text-rose-50">Ajouter une vente</h2>
          <form onSubmit={(e) => handleSubmit(e, fermer)} className="flex flex-col gap-3">
            <select value={produitId} onChange={(e) => setProduitId(e.target.value)} className={CHAMP}>
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
              step="1"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              placeholder="Quantité"
              className={CHAMP}
            />

            {total > 0 && (
              <p className="text-sm text-rose-200/70">
                Total :{' '}
                <span className="font-medium tabular-nums text-rose-50">
                  {total.toLocaleString('fr-FR')} Ariary
                </span>
              </p>
            )}

            {erreur && <p className="text-xs text-rose-300">{erreur}</p>}

            <div className="mt-2 flex gap-2">
              <button type="button" onClick={fermer} className={`flex-1 ${boutonRetour}`}>
                ← Retour
              </button>
              <button
                type="submit"
                disabled={enCours}
                className={`flex-1 ${boutonPrimaire} disabled:opacity-60`}
              >
                {enCours ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </>
      )}
    </Modale>
  )
}
