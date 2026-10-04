import GlassCard from './GlassCard.jsx'
import NombreAnime from './NombreAnime.jsx'

// Une "carte métrique" = un chiffre important + son label + une note en dessous.
//
// props :
//  - label       : texte au-dessus du chiffre (ex : "Chiffre d'affaires")
//  - nombre      : si fourni, le chiffre s'anime de 0 jusqu'à cette valeur
//  - suffixe     : petit texte à côté du nombre animé (ex : "Ariary")
//  - valeur      : alternative à `nombre`, pour afficher un texte déjà formaté
//  - note        : petit texte en dessous (ex : "+18% vs mois dernier")
//  - noteCouleur : classe Tailwind de la couleur de la note

export default function MetricCard({
  label,
  nombre,
  suffixe = '',
  valeur,
  note,
  noteCouleur = 'text-rose-300/80',
}) {
  return (
    <GlassCard>
      <p className="text-sm text-rose-200/70">{label}</p>
      <p className="mt-1 text-2xl font-medium text-rose-50">
        {nombre !== undefined ? <NombreAnime valeur={nombre} suffixe={suffixe} /> : valeur}
      </p>
      {note && <p className={`mt-2 text-xs ${noteCouleur}`}>{note}</p>}
    </GlassCard>
  )
}
