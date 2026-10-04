import { useCallback, useEffect, useRef, useState } from 'react'
import GlassCard from './GlassCard.jsx'

const DUREE_SORTIE = 190 // doit correspondre à la durée de .sortie-modale dans index.css

// Fenêtre modale en verre, avec animation d'entrée ET de sortie.
// Les enfants peuvent être une fonction ({ fermer }) => ... : appeler `fermer()`
// lance l'animation de sortie PUIS démonte la fenêtre (onFerme).
// La touche Échap ferme aussi la fenêtre.
//
// Structure : le fond assombri et la fenêtre sont des FRÈRES, jamais parent et
// enfant — un parent avec opacité animée casserait le flou du verre (voir index.css).

export default function Modale({ onFerme, children }) {
  const [sortie, setSortie] = useState(false)
  const dejaFerme = useRef(false)

  // Retourne true si cet appel a lancé la fermeture, false si elle était déjà en cours
  // (permet à un bouton "Confirmer" de ne déclencher son action qu'une seule fois).
  const fermer = useCallback(() => {
    if (dejaFerme.current) return false
    dejaFerme.current = true
    setSortie(true)
    setTimeout(onFerme, DUREE_SORTIE)
    return true
  }, [onFerme])

  useEffect(() => {
    function surTouche(e) {
      if (e.key === 'Escape') fermer()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [fermer])

  // Bloque le défilement de la page derrière la fenêtre
  useEffect(() => {
    const precedent = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = precedent
    }
  }, [])

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 bg-black/45 backdrop-blur-[8px] ${sortie ? 'sortie-overlay' : 'entree-overlay'}`}
        aria-hidden="true"
      />
      <div className={`relative w-full max-w-sm ${sortie ? 'sortie-modale' : 'entree-modale'}`}>
        <GlassCard incline={false} fond="bg-black/55">
          {typeof children === 'function' ? children({ fermer }) : children}
        </GlassCard>
      </div>
    </div>
  )
}
