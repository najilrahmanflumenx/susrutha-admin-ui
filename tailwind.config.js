/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        susrutha: {
          brand: '#B81C22',        // Subdued Deep Ayurvedic Red (Brand Touch)
          brandHover: '#981419',
          brandLight: '#FEF2F2',
          surface: '#FFFFFF',
          background: '#F8FAFC',   // Crisp Slate Gray Background
          foreground: '#0F172A',   // High Contrast Reading Text
          muted: '#64748B',        // Readable Secondary Text
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
