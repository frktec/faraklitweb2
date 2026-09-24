/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F6F7F8',
          100: '#EDF0F2',
          200: '#D9DEE3',
          300: '#B8C0C9',
          400: '#8A95A3',
          500: '#667085',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#182336',
          950: '#0A1628',
        },
        accent: {
          50: '#F0F5FF',
          100: '#DCE8FF',
          200: '#B8D0FF',
          300: '#8FB0FF',
          400: '#6B91F0',
          500: '#4A72E0',
          600: '#3558C7',
          700: '#2A45A0',
          800: '#233A82',
          900: '#1D3068',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        '8xl': '1280px',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};
