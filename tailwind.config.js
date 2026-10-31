/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#eef3fa',
          100: '#d9e4f3',
          200: '#b3c9e6',
          300: '#82a6d4',
          400: '#4f7fbd',
          500: '#2d5f9e',
          600: '#1f4a82',
          700: '#183a68',
          800: '#112b4f',
          900: '#0b1f3a',
          950: '#071428',
        },
        sky: {
          50: '#f1f8fe',
          100: '#dfeefb',
          200: '#bfdff8',
          300: '#8fc9f3',
          400: '#56aeea',
          500: '#2f93db',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(11, 31, 58, 0.04), 0 8px 24px -12px rgba(11, 31, 58, 0.12)',
        lift: '0 2px 4px rgba(11, 31, 58, 0.06), 0 18px 40px -16px rgba(11, 31, 58, 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-in': 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
