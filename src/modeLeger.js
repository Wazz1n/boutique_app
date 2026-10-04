// Filet de sécurité "fluidité" : l'interface est conçue pour être le plus
// belle possible (flou fort, fond animé, distorsion du verre). Sur un ordinateur
// modeste, ça peut ramer — et une interface qui rame est pire qu'une interface
// un peu moins chargée. Ici on MESURE la fluidité réelle quelques secondes
// après le démarrage ; si elle est trop basse, on bascule automatiquement en
// "mode léger" (voir .mode-leger dans index.css) : même look, flou plus
// économe, fond fixe. Sur une machine correcte, rien ne change.

const DELAI_AVANT_MESURE = 3000 // on laisse d'abord la page finir de se charger
const DUREE_MESURE = 2000
const SEUIL_IMAGES_PAR_SECONDE = 40

function mouvementReduit() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Retourne une fonction de nettoyage (à renvoyer tel quel depuis useEffect).
export function surveillerFluidite() {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return () => {}
  }

  const racine = document.documentElement

  if (mouvementReduit()) {
    racine.classList.add('mode-leger')
    return () => {}
  }

  let annule = false
  let image = 0

  const minuterie = setTimeout(() => {
    if (annule) return
    let debut = null
    let compteur = 0

    function compter(maintenant) {
      if (annule) return
      if (debut === null) {
        // 1re image : sert uniquement de point de départ de la mesure
        debut = maintenant
        image = requestAnimationFrame(compter)
        return
      }
      compteur += 1
      const ecoule = maintenant - debut

      if (ecoule < DUREE_MESURE) {
        image = requestAnimationFrame(compter)
        return
      }

      // Si l'onglet a été mis en arrière-plan pendant la mesure, le résultat
      // n'a aucun sens : on ne conclut rien.
      if (ecoule > DUREE_MESURE + 1500 || document.visibilityState !== 'visible') return

      const imagesParSeconde = (compteur * 1000) / ecoule
      if (imagesParSeconde < SEUIL_IMAGES_PAR_SECONDE) racine.classList.add('mode-leger')
    }

    image = requestAnimationFrame(compter)
  }, DELAI_AVANT_MESURE)

  return () => {
    annule = true
    clearTimeout(minuterie)
    cancelAnimationFrame(image)
  }
}
