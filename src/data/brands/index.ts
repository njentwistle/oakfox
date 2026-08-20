/**
 * Registry of client brand-guideline microsites.
 *
 * Add a client: copy `_template.ts`, fill it in, import it here, push it into
 * the array. The page at `src/pages/brand/[slug]/index.astro` builds one folder
 * per entry. `npm run brand:new -- <slug> "<Name>"` does the copying for you.
 */
import type { Brand } from './types';
import { magpiestale } from './magpiestale';

export const brands: Brand[] = [magpiestale];

export const brandBySlug = (slug: string): Brand | undefined =>
  brands.find((b) => b.slug === slug);

export type { Brand };
