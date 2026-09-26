// Ce composant ne dessine RIEN de visible — il déclare juste un filtre SVG
// réutilisable partout dans l'app via `filter: url(#verre-liquide)`.
//
// feTurbulence  : génère un bruit organique (comme des vaguelettes aléatoires)
// feDisplacementMap : utilise ce bruit pour DÉPLACER les pixels de ce qu'il y a
//                     derrière la carte -> effet de distorsion physique, pas
//                     juste un flou plat. C'est ça qui simule le verre épais.
//
// Le <animate> fait varier légèrement la fréquence du bruit en boucle lente,
// pour que le verre ait un mouvement organique même sans interaction —
// et GlassCard accélère/amplifie cette valeur au survol (voir plus loin).

export default function GlassFilterDefs() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <filter id="verre-liquide" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            id="turbulence"
            type="fractalNoise"
            baseFrequency="0.008 0.012"
            numOctaves="2"
            seed="7"
            result="bruit"
          >
            <animate
              attributeName="baseFrequency"
              values="0.008 0.012; 0.011 0.009; 0.008 0.012"
              dur="14s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            id="deplacement"
            in="SourceGraphic"
            in2="bruit"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
