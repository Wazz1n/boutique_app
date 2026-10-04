import GlassCard from './GlassCard.jsx'

// Formate un nombre en Ariary avec séparateur de milliers, ex : 45000 -> "45 000 Ariary"
function formatMontant(nombre) {
  return `${nombre.toLocaleString('fr-FR')} Ariary`
}

// Liste mélangée des dernières ventes ET des dernières entrées de stock.
// Chaque activité : { id, type: 'vente' | 'stock', titre, libelle, quantite, prix, quandTexte }
//  - vente : prix total + quantité vendue ("2 vendus")
//  - stock : quantité ajoutée ("+10 mis en stock"), pas de prix

export default function RecentSales({ activites }) {
  return (
    <GlassCard>
      <p className="mb-3 text-base font-medium text-rose-50">Activité récente</p>
      {activites.length === 0 ? (
        <p className="py-3 text-sm text-rose-200/60">Aucune activité pour l'instant.</p>
      ) : (
        <div className="cascade-lignes divide-y divide-white/10">
          {activites.map((a, index) => {
            const estVente = a.type === 'vente'
            return (
              <div
                key={a.id}
                style={{ '--ligne': Math.min(index, 10) }}
                className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors duration-200 hover:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-rose-50">{a.titre}</p>
                  <p className="mt-0.5 text-xs text-rose-200/60">
                    {a.libelle} · {a.quandTexte}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {estVente ? (
                    <>
                      <p className="text-sm tabular-nums text-rose-50">{formatMontant(a.prix)}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-rose-200/70">
                        {a.quantite} vendu{a.quantite > 1 ? 's' : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium tabular-nums text-green-300">+{a.quantite}</p>
                      <p className="mt-0.5 text-xs text-green-200/60">mis en stock</p>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
