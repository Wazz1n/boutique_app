// Ce composant ne dessine RIEN de visible — il déclare juste un filtre SVG
// réutilisable partout dans l'app via `backdrop-filter: url(#verre-liquide)`.
//
// feTurbulence      : génère un bruit organique (comme des vaguelettes aléatoires)
// feDisplacementMap : utilise ce bruit pour DÉPLACER les pixels de ce qu'il y a
//                     derrière la carte -> effet de distorsion physique, pas
//                     juste un flou plat. C'est ça qui simule le verre épais.
//
// Le filtre est volontairement STATIQUE (on n'anime plus ses paramètres) :
// l'animer forçait le navigateur à recalculer la distorsion à chaque image sur
// chaque carte, et c'était la première cause de saccades. Le côté "liquide"
// vient maintenant du fond qui bouge derrière un verre qui, lui, déforme
// toujours de la même façon : l'œil voit une vraie réfraction vivante.
//
// colorInterpolationFilters="sRGB" : sans ça, le navigateur convertit la carte
// de bruit en "linearRGB" et le gris neutre n'est plus neutre -> tout le fond
// serait décalé de quelques pixels en permanence.

export default function GlassFilterDefs() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true" focusable="false">
      <defs>
        <filter
          id="verre-liquide"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.012"
            numOctaves="1"
            seed="7"
            result="bruit"
          />
          <feDisplacementMap
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
