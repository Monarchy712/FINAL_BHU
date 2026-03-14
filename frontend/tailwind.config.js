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
        dark: {
          bg: '#050B14', // deep navy/black
          card: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        light: {
          bg: '#F0F8FF', // sky blue
          card: 'rgba(255, 255, 255, 0.7)',
          border: 'rgba(0, 0, 0, 0.1)',
        },
        accent: {
          cyan: '#00F0FF',
          teal: '#00BFA5',
          aurora: '#00FF88',
          ocean: '#0077D4',
          heat: {
            yellow: '#FFD700',
            orange: '#FF8C00',
            red: '#FF4500'
          }
        },
        'portal-navy': '#060E1A',
        'portal-teal': '#00f0ff',
        'portal-neon': '#64ffda',
        'portal-purple': '#b535f6',
        'portal-orange': '#ff6b00',
        'portal-red': '#ff3333',
        'portal-glass': 'rgba(10, 20, 40, 0.45)',
        'portal-border': 'rgba(0, 240, 255, 0.15)',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      backgroundImage: {
        'glow-gradient': 'radial-gradient(circle, var(--glow-color) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'globe-spin': 'globeSpin 15s linear infinite',
        'node-pulse': 'nodePulse 2s ease-in-out infinite alternate',
        'clock-spin': 'clockSpin 10s linear infinite',
        'time-wave': 'timeWave 4s linear infinite',
        'crack-grow': 'crackGrow 1s ease-out forwards',
        'heat-radiate': 'heatRadiate 3s ease-out infinite',
        'heat-blob-move': 'heatBlobMove 5s infinite alternate ease-in-out',
        'neural-flow': 'neuralFlow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        globeSpin: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        nodePulse: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(1.5)', opacity: '1', filter: 'drop-shadow(0 0 5px currentColor)' },
        },
        clockSpin: {
          '100%': { transform: 'rotate(360deg)' },
        },
        timeWave: {
          '100%': { transform: 'translateX(-50%)' },
        },
        crackGrow: {
          '0%': { strokeDashoffset: '500' },
          '100%': { strokeDashoffset: '0' },
        },
        heatRadiate: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8', border: '2px solid rgba(255,107,0,0.8)' },
          '100%': { transform: 'scale(2.5)', opacity: '0', border: '5px solid rgba(255,51,51,0)' },
        },
        heatBlobMove: {
          '100%': { transform: 'translate(15px, -15px) scale(1.1)' }
        },
        neuralFlow: {
          '0%': { opacity: '0.4', filter: 'drop-shadow(0 0 2px #64ffda)' },
          '100%': { opacity: '1', filter: 'drop-shadow(0 0 12px #00f0ff)' },
        }
      }
    },
  },
  plugins: [],
}
