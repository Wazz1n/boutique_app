import { useState, useEffect, useCallback, useMemo } from 'react'
import GlassCard from './components/GlassCard.jsx'
import Modale from './components/Modale.jsx'
import {
  boutonPrimaire,
  boutonRetour,
  boutonIcone,
  boutonMini,
} from './components/boutonStyles.js'
import { api } from './api.js'
import { notifier } from './toasts.js'

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

// props :
//  - version        : change à chaque modification faite ailleurs (ex : une vente
//                     ajoutée depuis le header) -> la page se recharge toute seule
//  - onModification : à appeler après chaque action ici (annulation, suppression),
//                     pour que le dashboard se mette à jour lui aussi

export default function StockPage({ version = 0, onModification }) {
  const [produits, setProduits] = useState([])
  const [mouvements, setMouvements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [confirmation, setConfirmation] = useState(null)

  const charger = useCallback(() => {
    return Promise.all([api.getProduits(), api.getMouvements()])
      .then(([p, m]) => {
        setProduits(p)
        setMouvements(m)
        setErreur('')
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false))
  }, [])

  useEffect(() => {
    charger()
  }, [charger, version])

  // Dernier mouvement non annulé de chaque produit (le backend les renvoie du
  // plus récent au plus ancien) — sert au bouton ↺ directement sur la ligne du
  // produit. Calculé une seule fois par chargement.
  const dernierParProduit = useMemo(() => {
    const carte = new Map()
    for (const m of mouvements) {
      if (m.produitId != null && !m.annule && !carte.has(m.produitId)) carte.set(m.produitId, m)
    }
    return carte
  }, [mouvements])

  function apresSucces(message) {
    notifier(message)
    if (onModification) onModification()
    else charger()
  }

  async function executerAnnulation(mouvement) {
    setErreur('')
    try {
      if (mouvement.type === 'vente') {
        await api.annulerVente(mouvement.venteId)
        apresSucces('Vente annulée')
      } else {
        await api.annulerMouvement(mouvement.id)
        apresSucces('Mouvement annulé')
      }
    } catch (err) {
      setErreur(err.message)
      notifier(err.message, 'erreur')
    }
  }

  async function executerSuppression(produit) {
    setErreur('')
    try {
      await api.supprimerProduit(produit.id)
      apresSucces('Produit supprimé')
    } catch (err) {
      setErreur(err.message)
      notifier(err.message, 'erreur')
    }
  }

  function demanderAnnulation(mouvement) {
    const estVente = mouvement.type === 'vente'
    setConfirmation({
      titre: estVente ? 'Annuler cette vente ?' : 'Annuler ce mouvement ?',
      message: estVente
        ? `La vente de « ${mouvement.produitNom} » sera supprimée et le stock remis en place.`
        : `« ${LIBELLES_TYPE[mouvement.type] || mouvement.type} — ${mouvement.produitNom} » sera annulé et le stock ajusté en conséquence.`,
      libelle: 'Oui, annuler',
      action: () => executerAnnulation(mouvement),
    })
  }

  function demanderSuppression(produit) {
    setConfirmation({
      titre: 'Supprimer ce produit ?',
      message: `« ${produit.nom} » disparaîtra du catalogue. L'historique des ventes déjà faites est conservé.`,
      libelle: 'Oui, supprimer',
      action: () => executerSuppression(produit),
    })
  }

  if (chargement) {
    return (
      <div className="flex flex-col gap-6">
        <div className="squelette h-72 rounded-3xl" />
        <div className="squelette h-56 rounded-3xl" />
      </div>
    )
  }

  // Filtre simple et insensible à la casse sur le nom du produit.
  const produitsFiltres = produits.filter((p) =>
    p.nom.toLowerCase().includes(recherche.trim().toLowerCase())
  )

  return (
    <>
      <div className="cascade flex flex-col gap-6">
        {/* Liste complète des produits, avec suppression et annulation rapide par ligne.
            Pas d'inclinaison 3D ici (incline={false}) : on ne veut pas que les boutons
            bougent sous le doigt ou la souris pendant qu'on vise. */}
        <GlassCard incline={false}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-base font-medium text-rose-50">Tous les produits</p>
            <span className="text-xs tabular-nums text-rose-200/60">
              {produitsFiltres.length} / {produits.length}
            </span>
          </div>

          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un produit..."
            className="mb-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-rose-50"
          />

          {erreur && <p className="mb-2 text-xs text-rose-300">{erreur}</p>}

          <div className="cascade-lignes divide-y divide-white/10">
            {produitsFiltres.map((p, index) => {
              const dernier = dernierParProduit.get(p.id)
              return (
                <div
                  key={p.id}
                  style={{ '--ligne': Math.min(index, 10) }}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-rose-50">{p.nom}</p>
                    <p className="text-xs text-rose-200/60">{p.prixVente.toLocaleString('fr-FR')} Ariary</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={
                        'whitespace-nowrap rounded-full px-3 py-1 text-sm ' +
                        (p.stockFaible
                          ? 'bg-amber-500/20 text-amber-200/90'
                          : 'bg-green-500/15 text-green-200/90')
                      }
                    >
                      {p.quantiteStock} en stock
                    </span>
                    {dernier && (
                      <button
                        type="button"
                        title="Annuler le dernier mouvement de ce produit"
                        onClick={() => demanderAnnulation(dernier)}
                        className={boutonIcone}
                      >
                        ↺
                      </button>
                    )}
                    <button
                      type="button"
                      title="Supprimer ce produit"
                      onClick={() => demanderSuppression(p)}
                      className={boutonIcone}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
            {produitsFiltres.length === 0 && (
              <p className="py-2 text-sm text-rose-200/60">
                {recherche
                  ? `Aucun produit ne correspond à "${recherche}".`
                  : "Aucun produit pour l'instant."}
              </p>
            )}
          </div>
        </GlassCard>

        {/* Historique complet, avec bouton d'annulation par ligne */}
        <GlassCard incline={false}>
          <p className="mb-3 text-base font-medium text-rose-50">Historique des mouvements</p>
          <div className="cascade-lignes divide-y divide-white/10">
            {mouvements.map((m, index) => (
              <div
                key={m.id}
                style={{ '--ligne': Math.min(index, 10) }}
                className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-white/5"
              >
                <div className="min-w-0">
                  <p className={`text-sm ${m.annule ? 'text-rose-200/40 line-through' : 'text-rose-50'}`}>
                    {LIBELLES_TYPE[m.type] || m.type} — {m.produitNom}
                  </p>
                  <p className="text-xs text-rose-200/60">
                    {m.type === 'vente' ? '-' : '+'}
                    {m.quantite} · {formatDate(m.date)}
                  </p>
                </div>
                {!m.annule && (
                  <button type="button" onClick={() => demanderAnnulation(m)} className={boutonMini}>
                    Annuler
                  </button>
                )}
                {m.annule && <span className="whitespace-nowrap text-xs text-rose-200/40">Annulé</span>}
              </div>
            ))}
            {mouvements.length === 0 && (
              <p className="py-2 text-sm text-rose-200/60">Aucun mouvement enregistré pour l'instant.</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Fenêtre de confirmation en verre (remplace la boîte grise du navigateur).
          Placée HORS du conteneur .cascade : sinon elle hériterait de son animation. */}
      {confirmation && (
        <Modale onFerme={() => setConfirmation(null)}>
          {({ fermer }) => (
            <>
              <h2 className="mb-2 text-base font-medium text-rose-50">{confirmation.titre}</h2>
              <p className="mb-5 text-sm text-rose-200/70">{confirmation.message}</p>
              <div className="flex gap-2">
                <button type="button" onClick={fermer} className={`flex-1 ${boutonRetour}`}>
                  ← Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // fermer() renvoie false au 2e clic : un double clic n'exécute l'action qu'une fois
                    if (fermer()) confirmation.action()
                  }}
                  className={`flex-1 ${boutonPrimaire}`}
                >
                  {confirmation.libelle}
                </button>
              </div>
            </>
          )}
        </Modale>
      )}
    </>
  )
}
