// Classes réutilisables pour tous les boutons de l'app.
// L'effet de rebond (survol / clic), les transitions et le reflet "brille"
// sont définis dans index.css (.bouton, .brille) pour rester au même endroit.

const BASE = 'bouton text-sm px-4 py-2.5 rounded-xl'

export const boutonPrimaire = `${BASE} brille bg-rose-400 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30`
export const boutonSecondaire = `${BASE} border border-rose-400/60 text-rose-300 hover:bg-rose-400/10`
export const boutonRetour = `${BASE} border border-white/15 text-rose-100/80 hover:bg-white/10`

// Petits boutons des listes (stock, historique)
export const boutonIcone =
  'bouton inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-400/40 text-xs text-rose-300 hover:bg-white/10'
export const boutonMini =
  'bouton whitespace-nowrap rounded-full border border-rose-400/40 px-3 py-1.5 text-xs text-rose-300 hover:bg-white/10'
