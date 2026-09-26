import GlassCard from './GlassCard.jsx'

// Formate un nombre en Ariary avec séparateur de milliers, ex: 45000 -> "45 000 Ar"
function formatMontant(nombre) {
  return `${nombre.toLocaleString('fr-FR')} Ariary`
}

export default function RecentSales({ ventes }) {
  return (
    <GlassCard>
      <p className="text-base font-medium text-rose-950 mb-3">Ventes récentes</p>
      <div className="divide-y divide-rose-900/10">
        {ventes.map((vente) => (
          <div key={vente.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-rose-950">{vente.produit}</p>
              <p className="text-xs text-rose-900/50 mt-0.5">{vente.quandTexte}</p>
            </div>
            <p className="text-sm text-rose-950">{formatMontant(vente.prix)}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
