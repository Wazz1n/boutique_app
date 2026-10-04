// Mini système de notifications ("toasts") : n'importe quel fichier peut appeler
//   notifier('Vente enregistrée')
//   notifier('Stock insuffisant', 'erreur')
// et ToastZone (monté une seule fois dans main.jsx) les affiche.
// Pas de contexte React ni de librairie : un simple abonnement suffit ici.

const ecouteurs = new Set()
let prochainId = 1

export function notifier(message, type = 'ok') {
  const toast = { id: prochainId, message, type }
  prochainId += 1
  ecouteurs.forEach((rappel) => rappel(toast))
}

export function surNotification(rappel) {
  ecouteurs.add(rappel)
  return () => {
    ecouteurs.delete(rappel)
  }
}
