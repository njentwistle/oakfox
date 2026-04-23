import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'OakFox Journal',
    description: 'Articles on sustainability, branding, design, and development from OakFox — a sustainable design studio in West Lancashire, UK.',
    site: context.site ?? 'https://oakfox.co.uk',
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}`,
      categories: post.data.tags,
      author: post.data.author,
    })),
    customData: '<language>en-gb</language>',
  });
}
