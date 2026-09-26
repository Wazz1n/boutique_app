import { useRef, useState } from 'react'

// Certains navigateurs (notamment Chrome selon la version) ne supportent pas
// la distorsion SVG combinée au backdrop-filter — sans cette détection, le
// flou entier risquerait de ne plus s'appliquer du tout sur ces navigateurs.
// On teste une fois, au chargement du module, et on adapte en conséquence.
const SUPPORTE_DISTORSION =
  typeof CSS !== 'undefined' && CSS.supports && CSS.supports('backdrop-filter', 'blur(1px) url(#a)')

const BACKDROP_FILTER = SUPPORTE_DISTORSION
  ? 'blur(25px) saturate(180%) url(#verre-liquide)'
  : 'blur(25px) saturate(180%)'

// --- La recette "Apple Liquid Glass", décomposée ---
//
// 1. filter: url(#verre-liquide)  -> distorsion organique via le SVG (voir GlassFilterDefs.jsx)
// 2. backdrop-filter: blur + saturate -> flou premium, couleurs qui restent vives derrière le verre
// 3. rim-light (inset ...rgba(255,255,255,.5)) -> fin liseré lumineux en haut, comme un biseau de verre
// 4. ombre douce et diffuse en dessous -> donne l'impression que la carte flotte (ambient occlusion)
// 5. tilt 3D au survol (onMouseMove) -> la carte s'incline légèrement vers le curseur
// 6. reflet spéculaire qui suit la souris -> un halo de lumière qui se déplace avec le curseur,
//    comme la lumière qui glisse sur une vraie plaque de verre
//
// Tout est fait en JS + CSS pur (pas de Three.js) : suffisant pour un effet bluffant
// sans alourdir le projet avec un moteur 3D pour de simples cartes de dashboard.

export default function GlassCard({ children, className = '' }) {
  const cardRef = useRef(null)
  const [style, setStyle] = useState({})
  const [reflet, setReflet] = useState({ x: 50, y: 50, opacite: 0 })

  function gererMouvement(e) {
    const carte = cardRef.current
    if (!carte) return
    const rect = carte.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width // 0 -> 1
    const y = (e.clientY - rect.top) / rect.height

    // Inclinaison max ±6deg, centrée sur le milieu de la carte
    const rotationY = (x - 0.5) * 12
    const rotationX = (0.5 - y) * 12

    setStyle({
      transform: `perspective(900px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale3d(1.015,1.015,1.015)`,
    })
    setReflet({ x: x * 100, y: y * 100, opacite: 0.55 })
  }

  function gererSortie() {
    setStyle({ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)' })
    setReflet((r) => ({ ...r, opacite: 0 }))
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={gererMouvement}
      onMouseLeave={gererSortie}
      style={{
        ...style,
        transition: 'transform 400ms cubic-bezier(0.34,1.56,0.64,1)',
        backdropFilter: BACKDROP_FILTER,
        WebkitBackdropFilter: 'blur(25px) saturate(180%)', // Safari ignore url() ici mais garde blur+saturate
        boxShadow:
          'inset 0 1.5px 0 rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.15), 0 20px 40px -12px rgba(75,21,40,0.35)',
      }}
      className={`relative overflow-hidden rounded-3xl bg-white/25 p-5 will-change-transform ${className}`}
    >
      {/* Reflet spéculaire qui suit le curseur, façon lumière glissant sur du verre */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
        style={{
          opacity: reflet.opacite,
          background: `radial-gradient(circle at ${reflet.x}% ${reflet.y}%, rgba(255,255,255,0.55), transparent 45%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}
