/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0b101a',
        comet: '#192132',
        aurora: '#1bd6b4',
        coral: '#ff6b5f',
        haze: '#9aa3b2',
        pearl: '#f6f7fb'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Sora"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 40px rgba(27, 214, 180, 0.35)'
      },
      backgroundImage: {
        'hero-grid': 'radial-gradient(circle at top left, rgba(27, 214, 180, 0.25), transparent 45%), radial-gradient(circle at bottom right, rgba(255, 107, 95, 0.25), transparent 50%)'
      }
    }
  },
  plugins: []
};
