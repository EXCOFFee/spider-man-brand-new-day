// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Static by default (ADR-002): HTML is prerendered and served from the edge.
// Only src/pages/api/slingers.ts opts into on-demand rendering, so the Vercel
// adapter emits a single serverless function for the counter and nothing else.
export default defineConfig({
  site: 'https://spider-man-brand-new-day.vercel.app',
  adapter: vercel(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
