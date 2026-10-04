import { useEffect, useRef, useState } from 'react'
import { surActiviteReseau } from '../api.js'

// Fine barre lumineuse en haut de l'écran pendant que l'app parle au serveur
// (comme sur YouTube ou GitHub). Elle n'apparaît qu'après 140 ms : les requêtes
// très rapides ne font donc pas clignoter la barre pour rien.

export default function BarreProgression() {
  const [phase, setPhase] = useState('repos') // 'repos' | 'charge' | 'fin'
  const phaseRef = useRef('repos')
  const delaiAffichage = useRef(null)
  const delaiFin = useRef(null)

  useEffect(() => {
    function changer(nouvellePhase) {
      phaseRef.current = nouvellePhase
      setPhase(nouvellePhase)
    }

    const seDesabonner = surActiviteReseau((actives) => {
      if (actives > 0) {
        clearTimeout(delaiFin.current)
        if (phaseRef.current === 'fin') changer('repos')
        if (phaseRef.current === 'repos' && !delaiAffichage.current) {
          delaiAffichage.current = setTimeout(() => {
            delaiAffichage.current = null
            changer('charge')
          }, 140)
        }
      } else {
        clearTimeout(delaiAffichage.current)
        delaiAffichage.current = null
        if (phaseRef.current === 'charge') {
          changer('fin')
          delaiFin.current = setTimeout(() => changer('repos'), 520)
        }
      }
    })

    return () => {
      seDesabonner()
      clearTimeout(delaiAffichage.current)
      clearTimeout(delaiFin.current)
      delaiAffichage.current = null
    }
  }, [])

  if (phase === 'repos') return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden="true">
      <div className={phase === 'charge' ? 'barre-charge' : 'barre-fin'} />
    </div>
  )
}
