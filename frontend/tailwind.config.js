/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0e1216',
        panel: '#151b21',
        raised: '#1b232c',
        line: '#26313c',
        amber: '#3f7fdd',
        blue: '#4d9fe8',
        green: '#3fb950',
        red: '#e5534b',
        orange: '#f08c00',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(63,127,221,0.4), 0 0 20px rgba(63,127,221,0.25)',
        'glow-lg': '0 0 0 1px rgba(63,127,221,0.5), 0 0 40px rgba(63,127,221,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
