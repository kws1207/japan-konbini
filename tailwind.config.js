/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Shippori Mincho"', 'serif'],
      },
      colors: {
        cream: '#fdf6e8',
        vermillion: '#c8102e',
      },
    },
  },
  plugins: [],
  important: true,
};
