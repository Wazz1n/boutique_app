// Fond de page commun (écran de connexion + application) :
//  1. la photo, dans un calque FIXE (et non en background-attachment: fixed,
//     ignoré sur iPhone où la photo s'étirerait sur toute la page) ;
//  2. un voile sombre léger pour garder le texte lisible ;
//  3. trois grandes taches de couleur qui dérivent lentement : c'est ce qui
//     donne au flou et à la distorsion du verre quelque chose de vivant ;
//  4. le contenu, au-dessus de tout ça.

export default function PageFond({ image, children }) {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(20, 8, 14, 0.5), rgba(10, 4, 8, 0.66)), url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orbe orbe-1" />
        <div className="orbe orbe-2" />
        <div className="orbe orbe-3" />
      </div>
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  )
}
