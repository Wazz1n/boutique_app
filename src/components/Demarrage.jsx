// Même écran que celui affiché par index.html avant le chargement de React
// (mêmes couleurs, même point lumineux) : la transition est invisible, il n'y
// a aucun "flash" entre le démarrage du navigateur et celui de l'application.

export default function Demarrage() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'radial-gradient(circle at 50% 40%, #2a0f1b, #0c0608 70%)' }}
      role="status"
      aria-label="Chargement"
    >
      <div className="point-demarrage" />
    </div>
  )
}
