import { useState, useEffect, useCallback } from 'react'
import GlassCard from './components/GlassCard.jsx'
import { api } from './api.js'

const LIBELLES_TYPE = {
  vente: 'Vente',
  reapprovisionnement: 'Réapprovisionnement',
  nouveau_produit: 'Nouveau produit',
}

function formatDate(dateIso) {
  return new Date(dateIso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StockPage() {
  const [produits, setProduits] = useState([])
  const [mouvements, setMouvements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(() => {
    Promise.all([api.getProduits(), api.getMouvements()])
      .then(([p, m]) => {
        setProduits(p)
        setMouvements(m)
      })
      .finally(() => setChargement(false))
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  // Dernier mouvement non-annulé pour un produit donné — sert au bouton
  // "↺" directement sur la ligne du produit (raccourci pratique sans
  // devoir chercher la bonne ligne dans tout l'historique en dessous).
  function dernierMouvementPour(produitId) {
    return mouvements.find((m) => m.produitId === produitId && !m.annule)
  }

  async function handleAnnulerMouvement(mouvement) {
    if (!window.confirm('Annuler ce mouvement ? Cette action ajuste le stock en conséquence.')) return
    setErreur('')
    try {
      if (mouvement.type === 'vente') {
        await api.annulerVente(mouvement.venteId)
      } else {
        await api.annulerMouvement(mouvement.id)
      }
      charger()
    } catch (err) {
      setErreur(err.message)
    }
  }

  async function handleSupprimerProduit(produit) {
    if (
      !window.confirm(
        `Supprimer "${produit.nom}" du catalogue ? L'historique des ventes déjà faites sera conservé.`
      )
    )
      return
    setErreur('')
    try {
      await api.supprimerProduit(produit.id)
      charger()
    } catch (err) {
      setErreur(err.message)
    }
  }

  if (chargement) return <p className="text-center text-rose-900/60 mt-10">Chargement...</p>

  return (
    <div className="flex flex-col gap-6">
      {/* Liste complète des produits, avec suppression et annulation rapide par ligne */}
      <GlassCard>
        <p className="text-base font-medium text-rose-950 mb-3">Tous les produits</p>
        {erreur && <p className="text-xs text-rose-600 mb-2">{erreur}</p>}
        <div className="divide-y divide-rose-900/10">
          {produits.map((p) => {
            const dernier = dernierMouvementPour(p.id)
            return (
              <div key={p.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-rose-950 truncate">{p.nom}</p>
                  <p className="text-xs text-rose-900/50">{p.prixVente.toLocaleString('fr-FR')} Ariary</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={
                      'text-sm px-3 py-1 rounded-full whitespace-nowrap ' +
                      (p.stockFaible ? 'bg-amber-100/70 text-amber-900/80' : 'bg-green-100/60 text-green-900/70')
                    }
                  >
                    {p.quantiteStock} en stock
                  </span>
                  {dernier && (
                    <button
                      title="Annuler le dernier mouvement de ce produit"
                      onClick={() => handleAnnulerMouvement(dernier)}
                      className="text-xs text-rose-600 border border-rose-300 w-7 h-7 rounded-full hover:bg-rose-50/50 transition-colors"
                    >
                      ↺
                    </button>
                  )}
                  <button
                    title="Supprimer ce produit"
                    onClick={() => handleSupprimerProduit(p)}
                    className="text-xs text-rose-700 border border-rose-300 w-7 h-7 rounded-full hover:bg-rose-50/50 transition-colors"
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
          {produits.length === 0 && <p className="text-sm text-rose-900/50 py-2">Aucun produit pour l'instant.</p>}
        </div>
      </GlassCard>

      {/* Historique complet, avec bouton d'annulation par ligne */}
      <GlassCard>
        <p className="text-base font-medium text-rose-950 mb-3">Historique des mouvements</p>
        <div className="divide-y divide-rose-900/10">
          {mouvements.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5 gap-3">
              <div className="min-w-0">
                <p className={`text-sm ${m.annule ? 'text-rose-900/30 line-through' : 'text-rose-950'}`}>
                  {LIBELLES_TYPE[m.type] || m.type} — {m.produitNom}
                </p>
                <p className="text-xs text-rose-900/50">
                  {m.type === 'vente' ? '-' : '+'}
                  {m.quantite} · {formatDate(m.date)}
                </p>
              </div>
              {!m.annule && (
                <button
                  onClick={() => handleAnnulerMouvement(m)}
                  className="text-xs text-rose-600 border border-rose-300 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-rose-50/50 transition-colors"
                >
                  Annuler
                </button>
              )}
              {m.annule && <span className="text-xs text-rose-900/30 whitespace-nowrap">Annulé</span>}
            </div>
          ))}
          {mouvements.length === 0 && (
            <p className="text-sm text-rose-900/50 py-2">Aucun mouvement enregistré pour l'instant.</p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
