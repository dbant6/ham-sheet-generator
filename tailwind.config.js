/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Calming, trustworthy medical palette
        ink: {
          DEFAULT: '#1a1a1a',
          soft: '#3a3a3a',
          muted: '#5a5a5a',
        },
        paper: {
          DEFAULT: '#fafaf7',  // warm off-white, easier on senior eyes than #fff
          card: '#ffffff',
          edge: '#ece9e2',
        },
        navy: {
          50:  '#eef3f8',
          100: '#d6e1ed',
          200: '#a8bdd4',
          500: '#3a5a7d',
          600: '#2c4869',
          700: '#1e3a5f',  // primary
          800: '#152a47',
          900: '#0c1a2e',
        },
        // For emergency alerts — warm rather than aggressive
        alert: {
          50:  '#fdf2f0',
          100: '#fbe1dd',
          500: '#d94343',
          600: '#bf3232',
          700: '#a02828',
        },
        ok: {
          500: '#2d8a5c',
          600: '#216c47',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"',
          'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
      fontSize: {
        // Senior-friendly: bump base size
        base: ['1.125rem', { lineHeight: '1.65' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 30, 50, 0.04), 0 8px 24px -8px rgba(20, 30, 50, 0.08)',
        focus: '0 0 0 4px rgba(58, 90, 125, 0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
