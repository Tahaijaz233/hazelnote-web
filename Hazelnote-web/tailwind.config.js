/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // You already have custom dark mode logic in globals.css using the "dark" class on body
  darkMode: 'class', 
  theme: {
    extend: {},
  },
  plugins: [],
}