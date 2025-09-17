// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://tktb-tess.github.io',
  base: '/commas',
  vite: {
    plugins: [tailwindcss()],
  },
});
