module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    data: {
      checked: 'ui~="checked"',
    },
    extend: {
      colors: {
        'red': {
          DEFAULT: '#c72020',
        },
        'green': {
          DEFAULT: '#2be515',
        },
      }
    },
  },
  plugins: [],
}