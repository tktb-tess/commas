// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import remarkToc from 'remark-toc';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://tktb-tess.github.io',
  base: '/commas/',
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 8000,
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
    processor: unified({
      remarkPlugins: [[remarkToc, { heading: '目次' }]],
    }),
  },
});
