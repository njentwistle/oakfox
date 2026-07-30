import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished } from '../../lib/posts';
import { locations } from '../../data/locations';
import { renderOgPng, type OgImageProps } from '../../utils/og';

interface PageEntry extends OgImageProps {
  slug: string;
}

const staticPages: PageEntry[] = [
  {
    slug: 'home',
    eyebrow: 'Sustainable design studio',
    title: 'We build brands that grow without costing the earth.',
    badge: 'West Lancashire',
  },
  {
    slug: 'about',
    eyebrow: 'About',
    title: 'A sustainable design studio, built on considered work.',
    subtitle: 'Led by Nathan James Entwistle · 15+ years of brand and web craft.',
    badge: 'Studio',
  },
  {
    slug: 'contact',
    eyebrow: 'Contact',
    title: 'Start a project with OakFox.',
    subtitle: 'We reply within 24 hours. No pitch, no obligation.',
    badge: 'Get in touch',
  },
  {
    slug: 'faq',
    eyebrow: 'FAQ',
    title: 'Questions we hear most often.',
    subtitle: 'Pricing, timelines, sustainability, and process.',
    badge: 'FAQ',
  },
  {
    slug: 'portfolio',
    eyebrow: 'Selected work',
    title: 'Branding, web, and marketing case studies.',
    subtitle: 'Shipped apps, client work, free tools, and original research.',
    badge: 'Portfolio',
  },
  {
    slug: 'blog',
    eyebrow: 'Journal',
    title: 'Essays on sustainable design, development, and marketing.',
    subtitle: 'Practical writing from Nathan James Entwistle.',
    badge: 'Journal',
  },
  {
    slug: 'services',
    eyebrow: 'Services',
    title: 'How we help.',
    subtitle: 'Branding, web, marketing, and environmental practice.',
    badge: 'Services',
  },
  {
    slug: 'services/branding',
    eyebrow: 'Service · Branding',
    title: 'Brands built to last, not to trend.',
    subtitle: 'Identity systems for businesses that want to grow without the environmental cost.',
    badge: 'Branding',
  },
  {
    slug: 'services/web-design',
    eyebrow: 'Service · Web Design',
    title: 'Websites designed around the people who use them.',
    subtitle: 'Information architecture, UX, and design systems — accessible from the start.',
    badge: 'Web Design',
  },
  {
    slug: 'services/development',
    eyebrow: 'Service · Development',
    title: 'Websites that load. Pages that last.',
    subtitle: 'Static-first, green-hosted, maintainable builds.',
    badge: 'Development',
  },
  {
    slug: 'services/copywriting',
    eyebrow: 'Service · Copywriting',
    title: 'Words that mean something. Not just fill space.',
    subtitle: 'Website copy, campaign copy, brand voice, long-form.',
    badge: 'Copywriting',
  },
  {
    slug: 'services/marketing',
    eyebrow: 'Service · Marketing',
    title: 'Marketing that earns attention, not buys it.',
    subtitle: 'Strategy, content, email, organic social, SEO — no greenwashing.',
    badge: 'Marketing',
  },
  {
    slug: 'services/environmental',
    eyebrow: 'Service · Environmental',
    title: 'Sustainability, by proof — not by claim.',
    subtitle: 'Verified green hosting and original ecological research, built into every project.',
    badge: 'Environmental',
  },
  {
    slug: 'website-carbon-audit',
    eyebrow: 'Free tool',
    title: 'How green is your website?',
    subtitle: 'Instant carbon audit — CO₂ per visit, page weight, green hosting check, A+ to F grade.',
    badge: 'Carbon Audit',
  },
  {
    slug: 'locations',
    eyebrow: 'Locations',
    title: 'Working across Lancashire. Delivering across the UK.',
    subtitle: 'Local in West Lancashire, regional in the North West, remote UK-wide.',
    badge: 'Locations',
  },
];

export const getStaticPaths: GetStaticPaths = async () => {
  const [portfolioItems, blogPosts] = await Promise.all([
    getCollection('portfolio'),
    getCollection('blog', isPublished),
  ]);

  const entries: PageEntry[] = [
    ...staticPages,
    ...locations.map((l) => ({
      slug: `locations/${l.slug}`,
      eyebrow: `${l.region} · Location`,
      title: `A design studio for ${l.name} businesses.`,
      subtitle: `Branding, web, marketing, and environmental work — ${l.distance}.`,
      badge: l.name,
    })),
    ...portfolioItems.map((item) => ({
      slug: `portfolio/${item.id}`,
      eyebrow: `Case study · ${item.data.category}`,
      title: item.data.title,
      subtitle: item.data.description,
      badge: 'Work',
    })),
    ...blogPosts.map((post) => ({
      slug: `blog/${post.id}`,
      eyebrow: `Journal · ${post.data.category}`,
      title: post.data.title,
      subtitle: post.data.description,
      badge: 'Journal',
    })),
  ];

  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: PageEntry };
  const png = await renderOgPng({
    eyebrow: entry.eyebrow,
    title: entry.title,
    subtitle: entry.subtitle,
    badge: entry.badge,
  });

  return new Response(png as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
