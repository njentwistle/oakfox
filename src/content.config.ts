import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(),
    // Overrides the <title> tag only. The on-page heading still uses `title`,
    // so a case study can read "TrailFox" while search results say what it is.
    seoTitle: z.string().optional(),
    description: z.string(),
    category: z.enum(['branding', 'design', 'development', 'marketing', 'consultancy']),
    thumbnail: z.string(),
    date: z.coerce.date(),
    // Lower = earlier on the portfolio grid and homepage. Entries without an
    // order sort after ordered ones, newest first.
    order: z.number().optional(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    client: z.string().optional(),
    outcomes: z.array(z.string()).default([]),
    testimonial: z
      .object({
        quote: z.string(),
        author: z.string(),
        role: z.string().optional(),
      })
      .optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // optional refresh date — drives schema dateModified without resetting the
    // original publish date (date). Set when materially updating an old post.
    updated: z.coerce.date().optional(),
    category: z.string(),
    author: z.string().default('OakFox'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        })
      )
      .optional(),
    // Optional research dataset attached to the post — emits schema.org
    // Dataset JSON-LD so it can surface in Google Dataset Search.
    dataset: z
      .object({
        name: z.string(),
        description: z.string(),
        license: z.string(),
        temporalCoverage: z.string(),
        spatialCoverage: z.string().optional(),
        keywords: z.array(z.string()).default([]),
        distribution: z
          .array(
            z.object({
              contentUrl: z.string(),
              encodingFormat: z.string(),
            })
          )
          .min(1),
      })
      .optional(),
    howto: z
      .object({
        name: z.string(),
        description: z.string(),
        totalTime: z.string().optional(),
        steps: z
          .array(
            z.object({
              name: z.string(),
              text: z.string(),
            })
          )
          .min(1),
      })
      .optional(),
  }),
});

export const collections = { portfolio, blog };
