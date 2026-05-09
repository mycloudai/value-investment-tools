import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1d1d1f',
        parchment: '#f5f5f7',
        action: '#0066cc',
        navy: '#041323',
        mist: '#eef5ff',
        sky: '#dcecff',
        tile: '#0c2038',
      },
      boxShadow: {
        product: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
      },
      fontFamily: {
        display: ['SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['SF Pro Text', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        rise: {
          '0%': {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        rise: 'rise 700ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;