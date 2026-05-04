import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['branding', 'design', 'development', 'marketing', 'consultancy']),
    thumbnail: z.string(),
    date: z.coerce.date(),
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
