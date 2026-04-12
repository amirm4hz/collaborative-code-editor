/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  // Enable class-based dark mode — we toggle by adding 'dark' to <html>
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        editor: {
          bg: '#1e1e2e',
          surface: '#2a2a3e',
          border: '#3a3a5c',
        }
      }
    },
  },
  plugins: [],
};