/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Monochrome palette: matte anthracite, light gray paper and neutral graphite.
        anthracite: { DEFAULT: '#232426', 700: '#3A3B3E', 800: '#2D2E30', 900: '#1B1C1D' },
        paper: { DEFAULT: '#F4F4F3', 200: '#E6E6E4', 300: '#D6D6D3' },
        graphite: { DEFAULT: '#8C8D90', 600: '#6B6C6F' },
        ink: {
          50: '#F7F7F7',
          100: '#EFEFEF',
          200: '#E1E1E0',
          300: '#C6C6C5',
          400: '#98989A',
          500: '#707072',
          600: '#555557',
          700: '#404042',
          800: '#2D2E30',
          900: '#232426',
          950: '#1B1C1D',
        },
        accent: {
          50: '#F5F5F5',
          100: '#EAEAEA',
          200: '#D5D5D5',
          300: '#B5B5B6',
          400: '#8E8E90',
          500: '#6E6E70',
          600: '#555557',
          700: '#404042',
          800: '#2D2E30',
          900: '#232426',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'],
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
