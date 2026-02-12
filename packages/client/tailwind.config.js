/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'axa-blue': '#00008F',
        'axa-red': '#FF1721',
        'axa-dark': '#1A1A3E',
        'axa-green': '#1CC54E',
        'axa-white': '#FFFFFF',
        'axa-grey': {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E8E8E8',
          300: '#CCCCCC',
          500: '#888888',
          700: '#4A4A4A',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        axa: '8px',
      },
      boxShadow: {
        'axa': '0 1px 3px 0 rgba(0, 0, 143, 0.06), 0 1px 2px -1px rgba(0, 0, 143, 0.06)',
        'axa-md': '0 4px 6px -1px rgba(0, 0, 143, 0.07), 0 2px 4px -2px rgba(0, 0, 143, 0.05)',
        'axa-lg': '0 10px 15px -3px rgba(0, 0, 143, 0.08), 0 4px 6px -4px rgba(0, 0, 143, 0.04)',
      },
    },
  },
  plugins: [],
};
