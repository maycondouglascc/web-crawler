/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        studio: {
          canvas: '#131415',
          card: '#0C0D0D',
          media: '#1D1D1E',
          input: '#242628',
          chip: '#252627',
          stroke: '#242628',
          muted: '#7E7E81',
          icon: '#888888',
          ctaText: '#262627',
        },
      },
      borderRadius: {
        'studio-sm': '12px',
        'studio-lg': '24px',
      },
    },
  },
  plugins: [],
}
