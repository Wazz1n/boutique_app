import GlassCard from './GlassCard.jsx'

// Graphique en barres fait avec du CSS pur (pas de librairie de graphique)
// -> plus rapide à mettre en place pour un prototype, zéro dépendance à installer.
// Si demain vous voulez un graphique plus riche (courbes, tooltips), on pourra
// migrer vers Recharts sans changer le reste de l'app.

export default function RevenueChart({ data }) {
  // On calcule la valeur max pour que la barre la plus haute prenne 100% de hauteur,
  // et que les autres soient proportionnelles.
  const max = Math.max(...data.map((d) => d.valeur))

  return (
    <GlassCard>
      <p className="text-base font-medium text-rose-950 mb-4">
        Chiffre d'affaires, 6 derniers mois
      </p>
      <div className="flex items-end gap-3 h-32">
        {data.map((point, index) => {
          const hauteurPourcent = (point.valeur / max) * 100
          const estDernier = index === data.length - 1
          return (
            <div key={point.mois} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-md ${estDernier ? 'bg-rose-400' : 'bg-peche-400'}`}
                style={{ height: `${hauteurPourcent}%` }}
              />
              <span className="text-xs text-rose-900/50">{point.mois}</span>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
