/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        algeria: {
          green: '#006233',
          red: '#D21034',
          gold: '#B48C3A',
          dark: '#1e293b',
          gray: '#f8fafc',
        }
      },
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
        'sans': ['Cairo', 'Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
