import { useState } from 'react'
import GlassCard from './components/GlassCard.jsx'
import { boutonPrimaire } from './components/boutonStyles.js'
import { api } from './api.js'

export default function LoginScreen({ onConnecte }) {
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!motDePasse) {
      setErreur('Entrez le mot de passe')
      return
    }
    setEnCours(true)
    setErreur('')
    try {
      await api.login(motDePasse)
      onConnecte()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage:
          'linear-gradient(160deg, rgba(212,83,126,0.35), rgba(75,21,40,0.55)), url(/login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <GlassCard className="w-full max-w-sm">
        <h1 className="font-display text-xl text-rose-950 mb-1">Boutique Élégance</h1>
        <p className="text-sm text-rose-900/60 mb-5">Entrez le mot de passe pour continuer</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="Mot de passe"
            className="rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm text-rose-950 outline-none focus:border-rose-400"
          />
          {erreur && <p className="text-xs text-rose-600">{erreur}</p>}
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
  )
}
