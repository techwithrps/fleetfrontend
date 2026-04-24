/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#009a49",
          hover: "#00813d",
        },
        sidebar: {
          bg: "#0d2119",
          hover: "#1a332a",
          active: "#009a49",
          text: "#e2e8f0",
        },
        background: "#f8fafb",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
      fontSize: {
        'xxs': '0.625rem',
        'xs': '0.75rem',
        'sm': '0.8125rem',
        'base': '0.875rem',
      }
    },
  },
  plugins: [],
};
