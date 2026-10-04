import { useEffect, useRef, useState } from 'react'

function mouvementReduit() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Affiche un nombre qui "compte" jusqu'à sa valeur (0 -> 1 240 000) avec un
// ralentissement progressif à l'arrivée. Quand la valeur change plus tard
// (ex : après une vente), il repart de la valeur affichée vers la nouvelle,
// sans repasser par zéro. Respecte le réglage système "réduire les animations".

export default function NombreAnime({ valeur, suffixe = '', duree = 1100 }) {
  const cible = Number.isFinite(valeur) ? valeur : 0
  const courant = useRef(mouvementReduit() ? cible : 0)
  const [affiche, setAffiche] = useState(courant.current)

  useEffect(() => {
    if (mouvementReduit()) {
      courant.current = cible
      setAffiche(cible)
      return undefined
    }

    const depart = courant.current
    // L'origine du temps est la 1re image de l'animation (et non performance.now()) :
    // on n'utilise ainsi qu'UNE seule horloge, celle que requestAnimationFrame fournit.
    let debut = null
    let image = 0

    function etape(maintenant) {
      if (debut === null) debut = maintenant
      const progres = Math.min(Math.max((maintenant - debut) / duree, 0), 1)
      const adouci = 1 - Math.pow(1 - progres, 4) // ralentit en fin de course
      const valeurCourante = depart + (cible - depart) * adouci
      courant.current = valeurCourante
      setAffiche(valeurCourante)
      if (progres < 1) image = requestAnimationFrame(etape)
    }

    image = requestAnimationFrame(etape)
    return () => cancelAnimationFrame(image)
  }, [cible, duree])

  return (
    <span className="tabular-nums">
      {Math.round(affiche).toLocaleString('fr-FR')}
      {suffixe && <span className="ml-1.5 text-sm font-normal text-rose-200/70">{suffixe}</span>}
    </span>
  )
}
