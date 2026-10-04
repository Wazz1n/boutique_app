import { useState, useEffect, useMemo, useRef } from 'react'
import Modale from './components/Modale.jsx'
import { boutonPrimaire, boutonRetour } from './components/boutonStyles.js'
import { api } from './api.js'
import { notifier } from './toasts.js'

// Formulaire "tout-en-un" : elle tape un nom de produit.
//  - Si ce nom correspond à un produit déjà connu -> on ajoute la quantité à son stock existant.
//  - Si c'est un nom nouveau (nouvel arrivage jamais vu) -> on crée le produit avec ce nom,
//    cette quantité et un prix de vente.
// Ça évite d'avoir deux écrans séparés "nouveau produit" / "réapprovisionner",
// utile vu que les arrivages sont imprévisibles.

const CHAMP =
  'rounded-xl border border-white/10 bg-black/45 px-3 py-2.5 text-sm text-rose-50'

export default function AddStockForm({ onFerme, onStockAjoute }) {
  const [produits, setProduits] = useState([])
  const [nom, setNom] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [prixVente, setPrixVente] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  // Verrou SYNCHRONE contre le double envoi : l'état `enCours` ne se met à jour qu'au
  // prochain affichage, trop tard si deux envois partent coup sur coup.
  const verrou = useRef(false)

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

  async function handleSubmit(e, fermer) {
    e.preventDefault()
    const quantiteNombre = Number(quantite)
    if (!nom.trim() || !Number.isInteger(quantiteNombre) || quantiteNombre < 1) {
      setErreur('Renseignez le nom du produit et une quantité valide')
      return
    }
    if (estNouveauProduit && (prixVente === '' || Number(prixVente) < 0)) {
      setErreur('Nouveau produit : indiquez son prix de vente')
      return
    }

    if (verrou.current) return
    verrou.current = true
    setEnCours(true)
    setErreur('')
    try {
      if (produitExistant) {
        await api.ajouterStock(produitExistant.id, quantiteNombre)
        notifier('Stock ajouté')
      } else {
        await api.creerProduit({
          nom: nom.trim(),
          prixVente: Number(prixVente),
          quantiteStock: quantiteNombre,
        })
        notifier('Nouveau produit ajouté')
      }
      onStockAjoute()
      // Bouton volontairement non réactivé : voir AddSaleForm (évite le double envoi)
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
          <h2 className="mb-1 text-base font-medium text-rose-50">Ajouter du stock</h2>
          <p className="mb-4 text-xs text-rose-200/60">
            Produit déjà existant ou nouvel arrivage, tapez juste le nom.
          </p>
          <form onSubmit={(e) => handleSubmit(e, fermer)} className="flex flex-col gap-3">
            <div>
              <input
                type="text"
                list="liste-produits"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom du produit"
                autoFocus
                className={`w-full ${CHAMP}`}
              />
              {/* La datalist propose les noms existants pendant la saisie, comme une auto-complétion */}
              <datalist id="liste-produits">
                {produits.map((p) => (
                  <option key={p.id} value={p.nom} />
                ))}
              </datalist>
              {nom.trim() && (
                <p className="mt-1 text-xs text-rose-200/60">
                  {produitExistant
                    ? `Produit existant — stock actuel : ${produitExistant.quantiteStock}`
                    : 'Nouveau produit — sera créé'}
                </p>
              )}
            </div>

            <input
              type="number"
              min="1"
              step="1"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              placeholder="Quantité reçue"
              className={CHAMP}
            />

            {estNouveauProduit && (
              <input
                type="number"
                min="0"
                value={prixVente}
                onChange={(e) => setPrixVente(e.target.value)}
                placeholder="Prix de vente (Ariary)"
                className={CHAMP}
              />
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
                {enCours ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </form>
        </>
      )}
    </Modale>
  )
}
