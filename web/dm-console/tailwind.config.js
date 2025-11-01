/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        success: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
      },
    },
  },
  plugins: [],
};
