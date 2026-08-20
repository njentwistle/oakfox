import type { Brand } from './types';

/**
 * Blank client template. Copy this file, rename it `<slug>.ts`, rename the
 * export, then register it in `index.ts` — or let `npm run brand:new` do all
 * three for you.
 *
 * Delete any section you are not supplying. The page renders exactly what is
 * in `sections`, in order, and the side navigation follows suit. Every `src`
 * must stay relative (`./assets/…`) so the page works on both oakfox.co.uk and
 * the client subdomain.
 */
export const template: Brand = {
  slug: 'CLIENT_SLUG',
  name: 'CLIENT NAME',
  descriptor: 'One line on who they are.',
  subdomain: 'CLIENT_SLUG.oakfox.co.uk',
  version: '1.0',
  updated: 'YYYY-MM-DD',

  // The page furniture. `accent` is the client's primary — it drives links,
  // rules, the active nav marker and the wash behind the cover.
  theme: {
    accent: '#1A5C12',
    ink: '#17181A',
    paper: '#FAF9F6',
    muted: '#6F7174',
    cover: { bg: '#17181A', fg: '#FAF9F6' },
  },

  // Omit `fonts` entirely to fall back to the OakFox stack (Playfair Display /
  // Work Sans / JetBrains Mono). Supply `href` and the page loads the client's
  // faces instead — the whole document then reads in their typography.
  fonts: {
    href: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600&display=swap',
    display: "'Work Sans', system-ui, sans-serif",
    body: "'Work Sans', system-ui, sans-serif",
    mono: "ui-monospace, monospace",
  },

  logo: {
    light: './assets/logo-light.svg', // reversed — used on the dark cover
    dark: './assets/logo-dark.svg',
    favicon: './assets/monogram.svg',
  },

  // Set once you have run `npm run brand:pdf -- CLIENT_SLUG`. Until then the
  // download button opens the browser print dialogue instead.
  // pdf: 'guidelines.pdf',

  contact: {
    name: 'Nathan Entwistle',
    role: 'OakFox',
    email: 'nathan@oakfox.co.uk',
    phone: '07730 396404',
  },

  sections: [
    {
      type: 'story',
      id: 'brand',
      title: 'The brand',
      intro: 'What the identity is built on.',
      statement: 'The one sentence everything else has to serve.',
      blocks: [
        { label: 'Who we are', body: '' },
        { label: 'Who we are for', body: '' },
      ],
      values: [{ name: '', body: '' }],
    },
    {
      type: 'logo',
      id: 'logo',
      title: 'The logo',
      intro: '',
      lockups: [
        {
          src: './assets/logo-dark.svg',
          alt: '',
          label: 'Primary',
          note: '',
          background: 'light',
        },
        {
          src: './assets/logo-light.svg',
          alt: '',
          label: 'Reversed',
          note: '',
          background: 'dark',
        },
      ],
      clearspace: { src: './assets/clearspace.svg', note: '' },
      minSize: {
        note: '',
        items: [
          { label: 'Screen', value: '120 px wide' },
          { label: 'Print', value: '32 mm wide' },
        ],
      },
      misuse: [{ src: './assets/misuse-stretch.svg', label: 'Do not stretch', note: '' }],
    },
    {
      type: 'colour',
      id: 'colour',
      title: 'Colour',
      intro: '',
      groups: [
        {
          label: 'Core',
          note: '',
          swatches: [{ name: '', hex: '#000000', rgb: '', cmyk: '', use: '' }],
        },
      ],
      // Contrast ratios and AA/AAA verdicts are calculated — just list the pairs.
      pairings: [{ label: '', fg: '#000000', bg: '#FFFFFF' }],
    },
    {
      type: 'type',
      id: 'type',
      title: 'Typography',
      intro: '',
      fonts: [
        {
          name: '',
          role: 'Display',
          stack: "'Work Sans', sans-serif",
          weights: [],
          source: '',
          specimen: '',
          note: '',
        },
      ],
      scale: [{ label: 'Display', size: '56px', lineHeight: '1.05', weight: '400', font: '', sample: '' }],
      rules: [''],
    },
    {
      type: 'voice',
      id: 'voice',
      title: 'Tone of voice',
      intro: '',
      principles: [{ name: '', body: '' }],
      examples: [{ context: '', yes: '', no: '' }],
      lexicon: { use: [], avoid: [] },
    },
    {
      type: 'gallery',
      id: 'applications',
      title: 'The brand applied',
      intro: '',
      columns: 3,
      items: [{ src: './assets/app-1.svg', alt: '', label: '', note: '' }],
      dos: [''],
      donts: [''],
    },
    {
      type: 'rules',
      id: 'checklist',
      title: 'Before it goes out',
      intro: '',
      columns: [
        { label: 'Always', tone: 'do', items: [''] },
        { label: 'Never', tone: 'dont', items: [''] },
        { label: 'Ask first', tone: 'note', items: [''] },
      ],
    },
    {
      type: 'assets',
      id: 'downloads',
      title: 'Downloads',
      intro: '',
      groups: [
        {
          label: 'Logo files',
          files: [{ name: '', href: './assets/downloads/', format: 'ZIP', note: '' }],
        },
      ],
    },
    // Escape hatch for anything the types above do not cover.
    // {
    //   type: 'custom',
    //   id: 'anything',
    //   title: 'Anything else',
    //   html: '<p>Raw HTML. Uses the page CSS — .grid, .g2, .g3, .rule-col, .value-card.</p>',
    // },
  ],
};
