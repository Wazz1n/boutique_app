import { useEffect, useRef } from 'react'

// Certains navigateurs ne supportent pas la distorsion SVG combinée au
// backdrop-filter — sans cette détection, le flou entier risquerait de ne plus
// s'appliquer du tout. On teste une fois, au chargement du module.
const SUPPORTE_DISTORSION =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('backdrop-filter', 'blur(1px) url(#a)')

const FLOU_PX = 40
const FLOU_SANS_DISTORSION = `blur(${FLOU_PX}px) saturate(180%)`
const BACKDROP_FILTER = SUPPORTE_DISTORSION
  ? `${FLOU_SANS_DISTORSION} url(#verre-liquide)`
  : FLOU_SANS_DISTORSION

const REPOS = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'

// --- La recette "Apple Liquid Glass" ---------------------------------------
//  - backdrop-filter : flou fort + saturation (+ distorsion SVG si supportée)
//  - rim-light       : fin liseré blanc en haut, comme un biseau qui accroche la lumière
//  - reflet diagonal : léger dégradé blanc fixe, comme une plaque de verre épaisse
//  - ombres          : ombre portée profonde + halo rosé, la carte "flotte"
//  - reflet spéculaire qui suit le curseur + inclinaison 3D très subtile
//
// CORRECTIF DU TREMBLEMENT AUX BORDS : avant, c'était LA carte qui s'inclinait
// ET qui écoutait la souris. Quand le curseur était sur le bord, l'inclinaison
// déplaçait ce bord sous le curseur -> le navigateur croyait que la souris
// sortait -> la carte revenait à plat -> la souris rentrait de nouveau ->
// boucle infinie = tremblement. Maintenant :
//   * une ENVELOPPE immobile écoute la souris (elle ne bouge jamais) ;
//   * seule la carte INTÉRIEURE s'incline.
// La zone sensible ne change donc plus jamais pendant l'animation.
//
// De plus, on modifie le style directement (refs) au lieu de passer par le
// state React : zéro re-rendu à chaque mouvement de souris, donc plus fluide.
//
// props :
//  - className  : classes de mise en page (largeur, etc.) appliquées à l'enveloppe
//  - fond       : classe Tailwind du fond de la carte (opacité du voile noir)
//  - incline    : false = pas d'inclinaison (listes, formulaires), reflet seulement

export default function GlassCard({
  children,
  className = '',
  fond = 'bg-black/35',
  incline = true,
}) {
  const enveloppeRef = useRef(null)
  const interieurRef = useRef(null)
  const refletRef = useRef(null)
  const imageRef = useRef(0)

  useEffect(
    () => () => {
      if (imageRef.current) cancelAnimationFrame(imageRef.current)
    },
    []
  )

  function gererMouvement(e) {
    if (imageRef.current) return // une seule mise à jour par image affichée
    const { clientX, clientY } = e
    imageRef.current = requestAnimationFrame(() => {
      imageRef.current = 0
      const enveloppe = enveloppeRef.current
      const interieur = interieurRef.current
      const reflet = refletRef.current
      if (!enveloppe || !interieur || !reflet) return

      const rect = enveloppe.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const x = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
      const y = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1)

      if (incline) {
        const rotationX = ((0.5 - y) * 4).toFixed(2)
        const rotationY = ((x - 0.5) * 4).toFixed(2)
        interieur.style.transform = `perspective(1000px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale3d(1.006, 1.006, 1.006)`
      }
      reflet.style.background = `radial-gradient(circle at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgba(255, 255, 255, 0.22), transparent 55%)`
      reflet.style.opacity = '1'
    })
  }

  function gererSortie() {
    if (imageRef.current) {
      cancelAnimationFrame(imageRef.current)
      imageRef.current = 0
    }
    if (interieurRef.current) interieurRef.current.style.transform = REPOS
    if (refletRef.current) refletRef.current.style.opacity = '0'
  }

  return (
    <div
      ref={enveloppeRef}
      onMouseMove={gererMouvement}
      onMouseLeave={gererSortie}
      className={`relative flex ${className}`}
    >
      <div
        ref={interieurRef}
        className={`verre relative min-w-0 flex-1 overflow-hidden rounded-3xl p-5 will-change-transform ${fond}`}
        style={{
          transform: REPOS,
          transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
          backdropFilter: BACKDROP_FILTER,
          WebkitBackdropFilter: FLOU_SANS_DISTORSION,
          backgroundImage:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.025) 38%, rgba(255, 255, 255, 0) 62%)',
          boxShadow:
            'inset 0 1.5px 0 rgba(255, 255, 255, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(255, 255, 255, 0.05), 0 24px 48px -16px rgba(0, 0, 0, 0.55), 0 8px 20px -10px rgba(212, 83, 126, 0.22)',
        }}
      >
        {/* Reflet spéculaire qui suit le curseur, façon lumière glissant sur du verre */}
        <div
          ref={refletRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{ opacity: 0, transition: 'opacity 350ms ease' }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  )
}
