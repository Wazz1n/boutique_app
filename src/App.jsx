import { useState, useEffect, useCallback } from 'react'
import MetricCard from './components/MetricCard.jsx'
import RevenueChart from './components/RevenueChart.jsx'
import RecentSales from './components/RecentSales.jsx'
import { boutonPrimaire, boutonSecondaire } from './components/boutonStyles.js'
import LoginScreen from './LoginScreen.jsx'
import AddSaleForm from './AddSaleForm.jsx'
import AddStockForm from './AddStockForm.jsx'
import StockPage from './StockPage.jsx'
import { api } from './api.js'

function formatMontant(nombre) {
  return `${nombre.toLocaleString('fr-FR')} Ariary`
}

// Transforme une date ISO en "Il y a X jours" pour rester lisible sans jargon.
function formatRelatif(dateIso) {
  const jours = Math.floor((Date.now() - new Date(dateIso)) / (1000 * 60 * 60 * 24))
  if (jours <= 0) return "Aujourd'hui"
  if (jours === 1) return 'Il y a 1 jour'
  return `Il y a ${jours} jours`
}

export default function App() {
  const [connecte, setConnecte] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [ventes, setVentes] = useState([])
  const [formulaireVenteOuvert, setFormulaireVenteOuvert] = useState(false)
  const [formulaireStockOuvert, setFormulaireStockOuvert] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [premierChargement, setPremierChargement] = useState(true)
  const [onglet, setOnglet] = useState('dashboard') // 'dashboard' | 'stock'

  const chargerDonnees = useCallback(() => {
    // On ne réaffiche le skeleton que la toute première fois — les rafraîchissements
    // suivants (après une vente ou un réapprovisionnement) se font en silence,
    // pour que ça paraisse instantané plutôt que de tout re-bloquer à chaque clic.
    if (premierChargement) setChargement(true)
    Promise.all([api.getDashboard(), api.getVentes()])
      .then(([d, v]) => {
        setDashboard(d)
        setVentes(v)
      })
      .finally(() => {
        setChargement(false)
        setPremierChargement(false)
      })
  }, [premierChargement])

  useEffect(() => {
    api
      .verifierSession()
      .then((res) => setConnecte(res.connecte))
      .catch(() => setConnecte(false))
  }, [])

  useEffect(() => {
    if (connecte) chargerDonnees()
  }, [connecte, chargerDonnees])

  if (connecte === null) return null
  if (!connecte) return <LoginScreen onConnecte={() => setConnecte(true)} />
  if (chargement || !dashboard) {
    // Écran de chargement "habillé" (cartes fantômes qui pulsent) plutôt qu'un
    // texte brut — perçu comme plus rapide même si le temps réel est identique.
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 w-48 bg-white/40 rounded-lg mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-white/30 rounded-3xl" />
          <div className="h-24 bg-white/30 rounded-3xl" />
          <div className="h-24 bg-white/30 rounded-3xl" />
        </div>
      </div>
    )
  }

  const variation =
    dashboard.chiffreAffairesMoisDernier > 0
      ? ((dashboard.chiffreAffaires - dashboard.chiffreAffairesMoisDernier) /
          dashboard.chiffreAffairesMoisDernier) *
        100
      : 0

  const ventesAffichage = ventes.slice(0, 5).map((v) => ({
    id: v.id,
    produit: v.lignes.map((l) => l.produitNom).join(', ') || 'Vente',
    prix: v.total,
    quandTexte: formatRelatif(v.dateVente),
  }))

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          'linear-gradient(160deg, rgba(212,83,126,0.3), rgba(75,21,40,0.45)), url(/dashboard-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/*
        Header fixe (sticky). Le fond flouté est un calque séparé, plus haut que
        le contenu visible, avec un masque en dégradé (.flou-degrade) : le flou
        s'estompe progressivement au lieu de s'arrêter net sur une bordure.
      */}
      <header className="sticky top-0 z-20 relative">
        <div
          className="absolute inset-0 h-[calc(100%+2.5rem)] backdrop-blur-[25px] bg-white/40 flou-degrade"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-3 px-4 py-4">
          <div>
            <h1 className="font-display text-2xl text-rose-950">Boutique Élégance</h1>
            <p className="text-sm text-rose-900/60 mt-1">Bonjour, voici votre semaine</p>
          </div>

          {/* Onglets Dashboard / Stock — restent dans le header fixe */}
          <div className="flex gap-1 bg-white/30 rounded-xl p-1 order-3 sm:order-none">
            <button
              onClick={() => setOnglet('dashboard')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                onglet === 'dashboard' ? 'bg-white/70 text-rose-950' : 'text-rose-900/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setOnglet('stock')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                onglet === 'stock' ? 'bg-white/70 text-rose-950' : 'text-rose-900/60'
              }`}
            >
              Stock
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFormulaireStockOuvert(true)}
              className={boutonSecondaire}
            >
              + Ajouter du stock
            </button>
            <button
              onClick={() => setFormulaireVenteOuvert(true)}
              className={boutonPrimaire}
            >
              + Ajouter une vente
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {onglet === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <MetricCard
                label="Chiffre d'affaires"
                valeur={formatMontant(dashboard.chiffreAffaires)}
                note={`${variation >= 0 ? '+' : ''}${variation.toFixed(0)}% vs mois dernier`}
                noteCouleur={variation >= 0 ? 'text-green-700/80' : 'text-rose-600/80'}
              />
              <MetricCard
                label="Mois dernier"
                valeur={formatMontant(dashboard.chiffreAffairesMoisDernier)}
                note="Référence de comparaison"
              />
              <MetricCard label="Ventes ce mois" valeur={dashboard.nombreVentes} note="Articles vendus" />
            </div>

            <div className="flex flex-col gap-6">
              <RevenueChart data={dashboard.historiqueCA.map((h) => ({ mois: h.mois, valeur: h.valeur }))} />
              <RecentSales ventes={ventesAffichage} />
            </div>
          </>
        ) : (
          <StockPage />
        )}
      </div>

      {formulaireVenteOuvert && (
        <AddSaleForm
          onFerme={() => setFormulaireVenteOuvert(false)}
          onVenteEnregistree={chargerDonnees}
        />
      )}
      {formulaireStockOuvert && (
        <AddStockForm
          onFerme={() => setFormulaireStockOuvert(false)}
          onStockAjoute={chargerDonnees}
        />
      )}
    </div>
  )
}
