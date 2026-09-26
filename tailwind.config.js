/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // On définit ici la palette "féminine moderne" une fois pour toutes.
      // Tout le projet utilisera rose-* et peche-* au lieu de couleurs en dur.
      colors: {
        rose: {
          50: '#FBEAF0',
          100: '#F4C0D1',
          200: '#ED93B1',
          400: '#D4537E',
          600: '#993556',
          900: '#4B1528',
        },
        peche: {
          50: '#FAECE7',
          100: '#F5C4B3',
          400: '#F0997B',
        },
      },
      fontFamily: {
        // Une serif élégante pour les titres, une sans-serif claire pour le reste.
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
