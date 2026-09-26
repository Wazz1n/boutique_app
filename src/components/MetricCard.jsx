import GlassCard from './GlassCard.jsx'

// Une "carte métrique" = un chiffre important + son label + une note en dessous.
// On la rend générique (props) pour l'utiliser 4 fois dans le dashboard
// sans dupliquer le code à chaque fois.
//
// props:
//  - label      : le texte au-dessus du chiffre (ex: "Chiffre d'affaires")
//  - valeur     : le chiffre affiché en grand
//  - note       : le petit texte en dessous (ex: "+18% vs mois dernier")
//  - noteCouleur: classe Tailwind pour la couleur de la note (vert si positif, etc.)

export default function MetricCard({ label, valeur, note, noteCouleur = 'text-rose-600/70' }) {
  return (
    <GlassCard>
      <p className="text-sm text-rose-900/60">{label}</p>
      <p className="text-2xl font-medium text-rose-950 mt-1">{valeur}</p>
      {note && <p className={`text-xs mt-2 ${noteCouleur}`}>{note}</p>}
    </GlassCard>
  )
}
