// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://oakfox.co.uk',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/dashboard') && !page.includes('/og/'),
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        const url = new URL(item.url);
        const path = url.pathname;
        if (path === '/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (path.startsWith('/services')) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        } else if (path.startsWith('/website-carbon-audit')) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        } else if (path.startsWith('/locations')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (path.startsWith('/portfolio/') && path !== '/portfolio/') {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (path.startsWith('/blog/') && path !== '/blog/') {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else {
          item.priority = 0.6;
        }
        return item;
      },
    }),
  ],
});