// Classes Tailwind réutilisables pour l'effet "rebond" au survol/clic des boutons.
// hover:scale-105 = grossit légèrement au survol
// active:scale-95  = rétrécit légèrement au clic (retour "physique")
// La courbe cubic-bezier(0.34,1.56,0.64,1) dépasse légèrement sa cible avant
// de revenir, ce qui donne cette sensation de rebond plutôt qu'un mouvement plat.

const BASE = 'transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95'

export const boutonPrimaire = `${BASE} bg-rose-400 hover:bg-rose-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-md shadow-rose-300/40`
export const boutonSecondaire = `${BASE} border border-rose-400 text-rose-600 text-sm px-4 py-2.5 rounded-xl`
export const boutonRetour = `${BASE} border border-rose-900/20 text-rose-900/70 text-sm px-4 py-2.5 rounded-xl`
