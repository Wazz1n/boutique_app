import { useRef, useState } from 'react'
import GlassCard from './components/GlassCard.jsx'
import PageFond from './components/PageFond.jsx'
import { boutonPrimaire } from './components/boutonStyles.js'
import { api } from './api.js'

// Petite secousse de la carte quand le mot de passe est faux (comme l'écran
// de verrouillage d'un téléphone). Via l'API Web Animations : aucune
// re-création de la carte, donc le champ garde son focus.
function secouer(element) {
  if (!element || typeof element.animate !== 'function') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  element.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-9px)' },
      { transform: 'translateX(8px)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 420, easing: 'ease-in-out' }
  )
}

export default function LoginScreen({ onConnecte }) {
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const carteRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!motDePasse) {
      setErreur('Entrez le mot de passe')
      secouer(carteRef.current)
      return
    }
    setEnCours(true)
    setErreur('')
    try {
      await api.login(motDePasse)
      onConnecte()
    } catch (err) {
      setErreur(err.message)
      secouer(carteRef.current)
      setEnCours(false)
    }
  }

  return (
    <PageFond image="/login-bg.jpg">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div ref={carteRef} className="w-full max-w-sm entree-modale">
          <GlassCard incline={false}>
            <h1 className="mb-1 font-display text-xl text-rose-50">Boutique</h1>
            <p className="mb-5 text-sm text-rose-200/70">Entrez le mot de passe pour continuer</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="Mot de passe"
                autoFocus
                className="rounded-xl border border-white/10 bg-black/45 px-4 py-2.5 text-sm text-rose-50"
              />
              {erreur && <p className="text-xs text-rose-300">{erreur}</p>}
              <button
                type="submit"
                disabled={enCours}
                className={`${boutonPrimaire} disabled:opacity-60`}
              >
                {enCours ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </PageFond>
  )
}
