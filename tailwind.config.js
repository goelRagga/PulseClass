/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c2d5ff',
          300: '#92b4fc',
          400: '#6090f8',
          500: '#3b6ef4',
          600: '#2554e8',
          700: '#1c41d4',
          800: '#1d37aa',
          900: '#1e3287',
        },
        gray: {
          0:   '#ffffff',
          25:  '#fafafa',
          50:  '#f7f8fa',
          100: '#f0f2f5',
          150: '#e8ebf0',
          200: '#dde1ea',
          300: '#c4cad6',
          400: '#9aa3b2',
          500: '#6b7585',
          600: '#4e5766',
          700: '#363f4e',
          800: '#222938',
          900: '#111827',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.04)',
        'card-lg': '0 12px 32px -4px rgba(0,0,0,0.10), 0 4px 12px -2px rgba(0,0,0,0.06)',
        'brand': '0 4px 14px 0 rgba(59,110,244,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'slide-up': 'slideUp 0.22s ease-out',
        'scale-in': 'scaleIn 0.18s ease-out',
        'pulse-slow': 'pulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}