/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk palette
        'cyber': {
          dark: '#0a0a0f',
          darker: '#050508',
          purple: '#1a1a2e',
          accent: '#00f0ff',
          glow: '#00d4ff',
        },
        // Terminal status colors
        'terminal': {
          green: '#22c55e',
          'green-glow': 'rgba(34, 197, 94, 0.5)',
          orange: '#f97316',
          'orange-glow': 'rgba(249, 115, 22, 0.5)',
          red: '#ef4444',
          'red-glow': 'rgba(239, 68, 68, 0.6)',
          gray: '#6b7280',
          blue: '#3b82f6',
        },
        // Window chrome
        'chrome': {
          bg: '#2d2d44',
          'bg-light': '#3d3d5c',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        // Traffic light buttons
        'traffic': {
          red: '#ff5f56',
          yellow: '#ffbd2e',
          green: '#27ca3f',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'pulse-orange': 'pulseOrange 2s ease-in-out infinite',
        'pulse-red': 'pulseRed 1s ease-in-out infinite',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseOrange: {
          '0%, 100%': {
            opacity: '0.7',
            boxShadow: '0 0 20px rgba(249, 115, 22, 0.5), 0 0 40px rgba(249, 115, 22, 0.3)',
          },
          '50%': {
            opacity: '1',
            boxShadow: '0 0 30px rgba(249, 115, 22, 0.7), 0 0 60px rgba(249, 115, 22, 0.5)',
          },
        },
        pulseRed: {
          '0%, 100%': {
            opacity: '0.7',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4)',
          },
          '50%': {
            opacity: '1',
            boxShadow: '0 0 50px rgba(239, 68, 68, 0.9), 0 0 80px rgba(239, 68, 68, 0.6)',
          },
        },
        pulseGreen: {
          '0%, 100%': {
            opacity: '0.8',
            boxShadow: '0 0 15px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)',
          },
          '50%': {
            opacity: '1',
            boxShadow: '0 0 25px rgba(34, 197, 94, 0.6), 0 0 50px rgba(34, 197, 94, 0.4)',
          },
        },
        glow: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.5), 0 0 40px rgba(249, 115, 22, 0.3)',
        'glow-red': '0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(0, 240, 255, 0.1)',
      },
      fontFamily: {
        'mono': ['Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
