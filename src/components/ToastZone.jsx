import { useEffect, useState } from 'react'
import { surNotification } from '../toasts.js'

const DUREE_VISIBLE = 2800
const DUREE_SORTIE = 260 // doit correspondre à .toast-sortie dans index.css

// Affiche les notifications envoyées par notifier() (voir toasts.js) :
// elles glissent depuis le bas, restent ~3 s, puis s'effacent en douceur.

export default function ToastZone() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const minuteries = new Set()

    const seDesabonner = surNotification((toast) => {
      setToasts((liste) => [...liste.slice(-2), { ...toast, sortie: false }])

      minuteries.add(
        setTimeout(() => {
          setToasts((liste) => liste.map((t) => (t.id === toast.id ? { ...t, sortie: true } : t)))
        }, DUREE_VISIBLE)
      )
      minuteries.add(
        setTimeout(() => {
          setToasts((liste) => liste.filter((t) => t.id !== toast.id))
        }, DUREE_VISIBLE + DUREE_SORTIE)
      )
    })

    return () => {
      seDesabonner()
      minuteries.forEach(clearTimeout)
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-center gap-2.5 rounded-2xl border border-white/15 bg-black/55 px-4 py-2.5 text-sm text-rose-50 shadow-xl shadow-black/40 backdrop-blur-[30px] ${
            t.sortie ? 'toast-sortie' : 'toast-entree'
          }`}
        >
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
              t.type === 'erreur' ? 'bg-rose-500/25 text-rose-200' : 'bg-green-500/25 text-green-200'
            }`}
          >
            {t.type === 'erreur' ? '✕' : '✓'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
