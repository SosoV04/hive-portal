/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Mirrors the CSS custom properties in src/index.css. LOCKED — do not deviate.
      colors: {
        gold: {
          DEFAULT: '#CFB991', // Boilermaker Old Gold, primary accent
          deep: '#8E6F3E', // hover states, depth, secondary accent
          soft: '#EDE3CE', // backgrounds, subtle fills
        },
        black: '#0F0F0F', // warm black — NOT pure #000
        ink: '#2A2622', // secondary text
        cream: '#F7F4EC', // page canvas
        white: '#FFFFFF', // cards
        success: '#7A8B4F', // muted olive-gold
        warning: '#C25E3A', // muted terracotta
        border: '#E5DFD1', // soft borders, dividers
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3.5rem, 7vw, 6rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.1' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.08em' }],
      },
      maxWidth: {
        container: '1240px',
      },
      transitionTimingFunction: {
        hive: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
}
