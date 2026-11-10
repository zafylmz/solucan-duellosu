import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0c0f14',
        panel: '#151a22',
        line: '#2a3344',
        electric: '#2f7bff',
        neon: '#3dff9a',
      },
    },
  },
  plugins: [],
};

export default config;
