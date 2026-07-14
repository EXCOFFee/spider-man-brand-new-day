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
  build: {
    // Inline all CSS into the document. The whole stylesheet is a few KB, and
    // inlining removes the render-blocking request so the LCP text paints as
    // soon as the HTML arrives (ADR-005).
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // The site ships a handful of tiny scripts; the module-preload helper
      // costs more than it saves and would bloat the always-loaded web
      // interaction bootstrap. Chunks are fetched on demand instead.
      modulePreload: false,
    },
  },
});
