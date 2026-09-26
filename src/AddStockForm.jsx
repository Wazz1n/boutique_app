import { useState, useEffect, useMemo } from 'react'
import GlassCard from './components/GlassCard.jsx'
import { boutonPrimaire, boutonRetour } from './components/boutonStyles.js'
import { api } from './api.js'

// Formulaire "tout-en-un" : elle tape un nom de produit.
//  - Si ce nom correspond à un produit déjà connu -> on ajoute la quantité à son stock existant.
//  - Si c'est un nom nouveau (nouvel arrivage jamais vu) -> on crée le produit avec ce nom,
//    cette quantité et un prix de vente.
// Ça évite d'avoir deux écrans séparés "nouveau produit" / "réapprovisionner",
// utile vu que les arrivages sont imprévisibles.

export default function AddStockForm({ onFerme, onStockAjoute }) {
  const [produits, setProduits] = useState([])
  const [nom, setNom] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [prixVente, setPrixVente] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    api.getProduits().then(setProduits).catch(() => setErreur('Impossible de charger les produits'))
  }, [])

  // Recherche si le nom tapé correspond exactement (sans tenir compte des majuscules)
  // à un produit déjà existant, pour savoir si on réapprovisionne ou si on crée.
  const produitExistant = useMemo(
    () => produits.find((p) => p.nom.trim().toLowerCase() === nom.trim().toLowerCase()),
    [produits, nom]
  )
  const estNouveauProduit = nom.trim().length > 0 && !produitExistant

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nom.trim() || quantite < 1) {
      setErreur('Renseignez le nom du produit et une quantité valide')
      return
    }
    if (estNouveauProduit && !prixVente) {
      setErreur('Nouveau produit : indiquez son prix de vente')
      return
    }

    setEnCours(true)
    setErreur('')
    try {
      if (produitExistant) {
        await api.ajouterStock(produitExistant.id, Number(quantite))
      } else {
        await api.creerProduit({
          nom: nom.trim(),
          prixVente: Number(prixVente),
          quantiteStock: Number(quantite),
        })
      }
      onStockAjoute()
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
        <h2 className="text-base font-medium text-rose-950 mb-1">Ajouter du stock</h2>
        <p className="text-xs text-rose-900/50 mb-4">
          Produit déjà existant ou nouvel arrivage, tapez juste le nom.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <input
              type="text"
              list="liste-produits"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom du produit"
              className="w-full rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm text-rose-950"
            />
            {/* La datalist propose les noms existants pendant la saisie, comme une auto-complétion */}
            <datalist id="liste-produits">
              {produits.map((p) => (
                <option key={p.id} value={p.nom} />
              ))}
            </datalist>
            {nom.trim() && (
              <p className="text-xs mt-1 text-rose-900/50">
                {produitExistant
                  ? `Produit existant — stock actuel : ${produitExistant.quantiteStock}`
                  : 'Nouveau produit — sera créé'}
              </p>
            )}
          </div>

          <input
            type="number"
            min="1"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            placeholder="Quantité reçue"
            className="rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm text-rose-950"
          />

          {estNouveauProduit && (
            <input
              type="number"
              min="0"
              value={prixVente}
              onChange={(e) => setPrixVente(e.target.value)}
              placeholder="Prix de vente (Ariary)"
              className="rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm text-rose-950"
            />
          )}

          {erreur && <p className="text-xs text-rose-600">{erreur}</p>}

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onFerme} className={`flex-1 ${boutonRetour}`}>
              ← Retour
            </button>
            <button type="submit" disabled={enCours} className={`flex-1 ${boutonPrimaire} disabled:opacity-60`}>
              {enCours ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
