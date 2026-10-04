import GlassCard from './GlassCard.jsx'

// Graphique en barres fait en CSS pur (aucune librairie à installer).
// Les barres "poussent" depuis le bas l'une après l'autre au chargement, et
// affichent leur montant exact au survol.
//
// Les hauteurs sont calculées en PIXELS (et pas en pourcentage) : un
// pourcentage de hauteur ne fonctionne que si le parent a une hauteur
// explicite, sinon la barre s'écrase à 0.

const HAUTEUR_GRAPHIQUE = 112

export default function RevenueChart({ data }) {
  // Math.max(1, ...) : évite une division par zéro quand aucune vente n'existe encore
  const max = Math.max(1, ...data.map((d) => d.valeur))

  return (
    <GlassCard>
      <p className="mb-7 text-base font-medium text-rose-50">Chiffre d'affaires, 6 derniers mois</p>
      <div className="flex items-end gap-3">
        {data.map((point, index) => {
          const estDernier = index === data.length - 1
          // Hauteur minimale de 4px : un mois à zéro reste visible comme une petite marque
          const hauteur = Math.max(Math.round((point.valeur / max) * HAUTEUR_GRAPHIQUE), 4)
          return (
            <div key={point.mois} className="group flex flex-1 flex-col items-center gap-2">
              <div className="relative w-full" style={{ height: HAUTEUR_GRAPHIQUE }}>
                <span
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 text-[11px] tabular-nums text-rose-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ bottom: hauteur + 6 }}
                >
                  {point.valeur.toLocaleString('fr-FR')}
                </span>
                <div
                  className={`barre-croissance absolute inset-x-0 bottom-0 rounded-t-lg transition-[filter] duration-200 group-hover:brightness-125 ${
                    estDernier
                      ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                      : 'bg-gradient-to-t from-peche-400/60 to-peche-400'
                  }`}
                  style={{ height: hauteur, animationDelay: `${300 + index * 90}ms` }}
                />
              </div>
              <span className="text-xs text-rose-200/60">{point.mois}</span>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
