/** @type {import('tailwindcss').Config} */
module.exports = {
  // FIX 4: Enforce dark mode permanently via class toggle
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        foreground: '#ffffff',
        gray: {
          800: '#1f1f1f',
          900: '#141414',
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
