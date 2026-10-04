import { useState, useEffect, useCallback } from 'react'
import MetricCard from './components/MetricCard.jsx'
import RevenueChart from './components/RevenueChart.jsx'
import RecentSales from './components/RecentSales.jsx'
import GlassCard from './components/GlassCard.jsx'
import PageFond from './components/PageFond.jsx'
import Demarrage from './components/Demarrage.jsx'
import { boutonPrimaire, boutonSecondaire } from './components/boutonStyles.js'
import LoginScreen from './LoginScreen.jsx'
import AddSaleForm from './AddSaleForm.jsx'
import AddStockForm from './AddStockForm.jsx'
import StockPage from './StockPage.jsx'
import { api } from './api.js'
import { surveillerFluidite } from './modeLeger.js'

// Transforme une date ISO en "Il y a X jours" pour rester lisible sans jargon.
function formatRelatif(dateIso) {
  const jours = Math.floor((Date.now() - new Date(dateIso)) / (1000 * 60 * 60 * 24))
  if (jours <= 0) return "Aujourd'hui"
  if (jours === 1) return 'Il y a 1 jour'
  return `Il y a ${jours} jours`
}

const IMAGE_DASHBOARD = '/dashboard-bg.jpg'

const LIBELLES_STOCK = {
  reapprovisionnement: 'Réapprovisionnement',
  nouveau_produit: 'Nouveau produit',
}

export default function App() {
  const [connecte, setConnecte] = useState(null) // null = on ne sait pas encore
  const [dashboard, setDashboard] = useState(null)
  const [ventes, setVentes] = useState([])
  const [mouvements, setMouvements] = useState([])
  const [erreurChargement, setErreurChargement] = useState('')
  const [formulaireVenteOuvert, setFormulaireVenteOuvert] = useState(false)
  const [formulaireStockOuvert, setFormulaireStockOuvert] = useState(false)
  const [onglet, setOnglet] = useState('dashboard') // 'dashboard' | 'stock'
  // Augmente après chaque modification : la page Stock s'en sert pour se recharger
  const [version, setVersion] = useState(0)

  // Mesure la fluidité au démarrage et passe en "mode léger" si l'écran rame
  useEffect(() => surveillerFluidite(), [])

  const chargerDonnees = useCallback(() => {
    return Promise.all([
      api.getDashboard(),
      api.getVentes(),
      // Si l'historique du stock ne se charge pas, le dashboard s'affiche quand même
      // (il y manquera seulement les entrées de stock dans "Activité récente")
      api.getMouvements().catch(() => []),
    ])
      .then(([d, v, m]) => {
        setDashboard(d)
        setVentes(v)
        setMouvements(m)
        setErreurChargement('')
      })
      .catch((err) => {
        if (err.status === 401) {
          setConnecte(false) // session expirée : retour à l'écran de connexion
          return
        }
        setErreurChargement(err.message || 'Impossible de charger les données')
      })
  }, [])

  // Après une vente, un ajout de stock, une annulation... : on recharge le
  // dashboard ET on prévient la page Stock de se recharger aussi.
  const apresModification = useCallback(() => {
    setVersion((v) => v + 1)
    chargerDonnees()
  }, [chargerDonnees])

  // Au démarrage : y a-t-il déjà une session valide (cookie de 90 jours) ?
  useEffect(() => {
    api
      .verifierSession()
      .then((res) => setConnecte(res.connecte))
      .catch(() => setConnecte(false))
  }, [])

  useEffect(() => {
    if (connecte) chargerDonnees()
  }, [connecte, chargerDonnees])

  if (connecte === null) return <Demarrage />
  if (!connecte) return <LoginScreen onConnecte={() => setConnecte(true)} />

  if (!dashboard) {
    return (
      <PageFond image={IMAGE_DASHBOARD}>
        <div className="mx-auto max-w-3xl px-4 py-10">
          {erreurChargement ? (
            <GlassCard incline={false}>
              <p className="mb-1 text-base font-medium text-rose-50">Chargement impossible</p>
              <p className="mb-4 text-sm text-rose-200/70">{erreurChargement}</p>
              <button
                type="button"
                className={boutonPrimaire}
                onClick={() => {
                  setErreurChargement('')
                  chargerDonnees()
                }}
              >
                Réessayer
              </button>
            </GlassCard>
          ) : (
            // Cartes fantômes avec un reflet qui balaie : mêmes dimensions que la vraie page
            <div aria-hidden="true">
              <div className="squelette mb-8 h-12 w-56 rounded-2xl" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="squelette h-28 rounded-3xl" />
                <div className="squelette h-28 rounded-3xl" />
                <div className="squelette h-28 rounded-3xl" />
              </div>
              <div className="squelette mt-6 h-52 rounded-3xl" />
            </div>
          )}
        </div>
      </PageFond>
    )
  }

  const aMoisPrecedent = dashboard.chiffreAffairesMoisDernier > 0
  const variation = aMoisPrecedent
    ? ((dashboard.chiffreAffaires - dashboard.chiffreAffairesMoisDernier) /
        dashboard.chiffreAffairesMoisDernier) *
      100
    : 0
  const noteVariation = aMoisPrecedent
    ? `${variation >= 0 ? '+' : ''}${Math.round(variation)}% vs mois dernier`
    : 'Pas encore de mois à comparer'

  // "Activité récente" = dernières ventes + dernières entrées de stock, mélangées par date.
  // Les mouvements de type "vente" sont écartés ici : les ventes viennent déjà de
  // `ventes` (avec leur prix), les garder ferait apparaître chaque vente en double.
  // Les mouvements annulés ne sont pas affichés non plus.
  const activites = [
    ...ventes.map((v) => ({
      id: `vente-${v.id}`,
      type: 'vente',
      titre: v.lignes.map((l) => l.produitNom).filter(Boolean).join(', ') || 'Vente',
      libelle: 'Vente',
      quantite: v.lignes.reduce((somme, l) => somme + l.quantite, 0),
      prix: v.total,
      date: v.dateVente,
    })),
    ...mouvements
      .filter((m) => m.type !== 'vente' && !m.annule)
      .map((m) => ({
        id: `stock-${m.id}`,
        type: 'stock',
        titre: m.produitNom,
        libelle: LIBELLES_STOCK[m.type] || 'Stock',
        quantite: m.quantite,
        prix: null,
        date: m.date,
      })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
    .map((a) => ({ ...a, quandTexte: formatRelatif(a.date) }))

  return (
    <PageFond image={IMAGE_DASHBOARD}>
      {/*
        Header fixe (sticky). Le fond flouté est un calque séparé, plus haut que
        le contenu visible, avec un masque en dégradé (.flou-degrade) : le flou
        s'estompe progressivement au lieu de s'arrêter net sur une bordure.
        Flou le plus fort de toute l'app (45px) : c'est l'élément toujours
        visible, c'est lui qui doit le plus "accrocher" l'effet verre.
      */}
      <header className="sticky top-0 z-20">
        <div
          className="flou-degrade absolute inset-0 h-[calc(100%_+_2.5rem)] bg-black/40 backdrop-blur-[45px] backdrop-saturate-150"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="font-display text-2xl text-rose-50">Boutique</h1>
            <p className="mt-1 text-sm text-rose-200/70">Bonjour, voici votre semaine</p>
          </div>

          {/* Onglets Dashboard / Stock : une pastille glisse de l'un à l'autre */}
          <div
            className="relative order-3 grid grid-cols-2 rounded-xl bg-black/30 p-1 sm:order-none"
            role="tablist"
          >
            <span
              aria-hidden="true"
              className="absolute bottom-1 left-1 top-1 w-[calc(50%_-_0.25rem)] rounded-lg bg-white/15 shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: onglet === 'stock' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            <button
              type="button"
              role="tab"
              aria-selected={onglet === 'dashboard'}
              onClick={() => setOnglet('dashboard')}
              className={`relative z-10 rounded-lg px-4 py-1.5 text-sm transition-colors duration-300 ${
                onglet === 'dashboard' ? 'text-rose-50' : 'text-rose-200/70 hover:text-rose-50'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={onglet === 'stock'}
              onClick={() => setOnglet('stock')}
              className={`relative z-10 rounded-lg px-4 py-1.5 text-sm transition-colors duration-300 ${
                onglet === 'stock' ? 'text-rose-50' : 'text-rose-200/70 hover:text-rose-50'
              }`}
            >
              Stock
            </button>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setFormulaireStockOuvert(true)} className={boutonSecondaire}>
              + Ajouter du stock
            </button>
            <button type="button" onClick={() => setFormulaireVenteOuvert(true)} className={boutonPrimaire}>
              + Ajouter une vente
            </button>
          </div>
        </div>
      </header>

      {/* key={onglet} : React remonte le contenu à chaque bascule d'onglet, ce qui
          rejoue l'entrée en cascade des cartes (voir .cascade dans index.css). */}
      <main key={onglet} className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        {onglet === 'dashboard' ? (
          <>
            <div className="cascade mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                label="Chiffre d'affaires"
                nombre={dashboard.chiffreAffaires}
                suffixe="Ariary"
                note={noteVariation}
                noteCouleur={
                  !aMoisPrecedent
                    ? 'text-rose-200/60'
                    : variation >= 0
                      ? 'text-green-300/90'
                      : 'text-rose-300/90'
                }
              />
              <MetricCard
                label="Mois dernier"
                nombre={dashboard.chiffreAffairesMoisDernier}
                suffixe="Ariary"
                note="Référence de comparaison"
              />
              <MetricCard label="Ventes ce mois" nombre={dashboard.nombreVentes} note="Articles vendus" />
            </div>

            <div className="cascade flex flex-col gap-6" style={{ '--base': '260ms' }}>
              <RevenueChart data={dashboard.historiqueCA.map((h) => ({ mois: h.mois, valeur: h.valeur }))} />
              <RecentSales activites={activites} />
            </div>
          </>
        ) : (
          <StockPage version={version} onModification={apresModification} />
        )}
      </main>

      {formulaireVenteOuvert && (
        <AddSaleForm
          onFerme={() => setFormulaireVenteOuvert(false)}
          onVenteEnregistree={apresModification}
        />
      )}
      {formulaireStockOuvert && (
        <AddStockForm
          onFerme={() => setFormulaireStockOuvert(false)}
          onStockAjoute={apresModification}
        />
      )}
    </PageFond>
  )
}
