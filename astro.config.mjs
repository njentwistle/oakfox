// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// Real per-URL lastmod for the sitemap. The daily cron rebuild used to stamp
// every URL with the build time, which teaches Google to ignore lastmod — and
// new posts went weeks without being discovered. Blog posts use their
// `updated ?? date` frontmatter; the blog hub and homepage use the newest live
// post; everything else omits lastmod rather than claiming a daily change.
const BLOG_DIR = './src/content/blog';
const postLastmod = new Map();
let newestPost;
for (const file of readdirSync(BLOG_DIR)) {
  if (!/\.mdx?$/.test(file)) continue;
  const fm = readFileSync(`${BLOG_DIR}/${file}`, 'utf8').split('---')[1] ?? '';
  const field = (name) => fm.match(new RegExp(`^${name}:\\s*['"]?([^'"\\n]+)`, 'm'))?.[1];
  const published = new Date(field('date'));
  if (field('draft') === 'true' || !(published <= new Date())) continue;
  const lastmod = new Date(field('updated') ?? published);
  postLastmod.set(`/blog/${file.replace(/\.mdx?$/, '')}/`, lastmod);
  if (!newestPost || lastmod > newestPost) newestPost = lastmod;
}

// https://astro.build/config
export default defineConfig({
  site: 'https://oakfox.co.uk',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/dashboard') &&
        // Client brand guidelines: confidential, and served from their own
        // subdomains. Never in the sitemap on either host.
        !page.includes('/brand/') &&
        // Client sign-offs open from a private link only.
        !page.includes('/sign-off') &&
        !page.includes('/og/') &&
        !page.includes('/blog/tags/'),
      changefreq: 'weekly',
      serialize(item) {
        const url = new URL(item.url);
        const path = url.pathname;
        const lastmod = path === '/' || path === '/blog/' ? newestPost : postLastmod.get(path);
        if (lastmod) item.lastmod = lastmod.toISOString();
        else delete item.lastmod;
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