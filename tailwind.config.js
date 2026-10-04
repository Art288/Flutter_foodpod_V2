/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          DEFAULT: '#ff6600',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          accent: '#FF7A00',
          glow: 'rgba(255, 106, 0, 0.4)',
        },
        dark: {
          bg: '#0A0A0E',
          card: '#13131A',
          cardHover: '#1B1B24',
          border: '#242432',
          muted: '#8E8EA0',
        }
      },
      boxShadow: {
        'orange-glow': '0 0 25px -5px rgba(255, 102, 0, 0.3)',
        'orange-glow-lg': '0 0 40px -5px rgba(255, 102, 0, 0.45)',
        'card-dark': '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        sans: ['Prompt', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
