/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system tokens - will be overridden by CSS variables
        primary: 'var(--color-primary)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
      },
      borderRadius: {
        medium: 'var(--radius-medium)',
      },
      spacing: {
        md: 'var(--spacing-md)',
      },
      boxShadow: {
        medium: 'var(--shadow-medium)',
      },
    },
  },
  plugins: [],
}

