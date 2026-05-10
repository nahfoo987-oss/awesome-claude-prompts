/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        cream: "#fdf8f3",
        rose: {
          blush: "#f5e6e0",
          muted: "#d4a5a0",
          deep: "#b5706a",
        },
        warm: {
          brown: "#5c3d2e",
          tan: "#c9a882",
        },
      },
    },
  },
  plugins: [],
};
