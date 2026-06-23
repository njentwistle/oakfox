import type { CollectionEntry } from 'astro:content';

/**
 * Single source of truth for "is this blog post live?".
 *
 * A post is published only when it is NOT a draft AND its `date` has arrived
 * (evaluated at build time). Future-dated posts therefore stay queued and
 * invisible — no page, no listing, no RSS item, no OG image, no sitemap entry —
 * until a build runs on or after their date.
 *
 * Because this is a static site, "a build runs" is the publish event. The daily
 * scheduled rebuild in `.github/workflows/deploy.yml` is what flips queued posts
 * live on their go-live date without a manual push.
 *
 * Use this everywhere the blog collection is read so the queue behaves
 * consistently across the index, post pages, tag pages, RSS and OG images.
 */
export function isPublished({ data }: CollectionEntry<'blog'>): boolean {
  return !data.draft && data.date.valueOf() <= Date.now();
}
