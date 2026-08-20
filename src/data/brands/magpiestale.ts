import type { Brand } from './types';

/**
 * The Magpie's Tale. Independent bookshop, Churchtown, Southport.
 *
 * Built from one supplied asset: the client's pen drawing of the shopfront.
 * The magpie in `assets/magpie.svg` is traced from that drawing rather than
 * redrawn, which is why it still wobbles.
 *
 * ⚠️ Positioning copy (the story blocks, values and voice examples) is a
 * proposal, not dictated fact. Confirm the shop's own account of itself before
 * this link goes to print or to a supplier. Everything about colour, type,
 * logo use and the checklist is settled and does not need confirming.
 */
export const magpiestale: Brand = {
  slug: 'magpiestale',
  name: 'The Magpie’s Tale',
  descriptor: 'An independent bookshop in Churchtown, Southport.',
  subdomain: 'magpiestale.oakfox.co.uk',
  version: '1.0',
  updated: '2026-08-20',

  theme: {
    accent: '#0B6E6E',
    ink: '#0E0E0F',
    paper: '#FFFFFF',
    muted: '#6E6E6F',
    cover: { bg: '#0E0E0F', fg: '#FFFFFF' },
  },

  // One family, self-hosted, 41 KB for the pair. `mono` points at the same
  // stack on purpose: a second face would have been the easy call and the
  // wrong one for a shop that sells books set in exactly this kind of type.
  fonts: {
    href: './assets/fonts.css',
    display: "'EB Garamond', Garamond, Georgia, 'Times New Roman', serif",
    body: "'EB Garamond', Garamond, Georgia, 'Times New Roman', serif",
    mono: "'EB Garamond', Garamond, Georgia, serif",
  },

  logo: {
    // The cover prints the shop name as live type, so this slot takes the
    // magpie. Pointing it at the wordmark sets the name twice.
    light: './assets/magpie-reversed.svg',
    dark: './assets/logo.svg',
    favicon: './assets/favicon.svg',
  },

  contact: {
    name: 'Nathan Entwistle',
    role: 'OakFox',
    email: 'nathan@oakfox.co.uk',
    phone: '07730 396404',
  },

  sections: [
    // ── 01 ──────────────────────────────────────────────────────────────────
    {
      type: 'story',
      id: 'brand',
      title: 'The idea',
      nav: 'The idea',
      intro:
        'An independent bookshop in Churchtown, Southport.',
      statement: 'Everything is black and white, except the shimmer.',
      blocks: [
        {
          label: 'Where that comes from',
          body: 'A magpie looks black and white until the light catches it. Then the tail turns green, then blue, then violet, and then it goes back to black. Ink and paper do the work, and one narrow band of colour is used to draw the eye.',
        },
        {
          label: 'Where it has to work',
          body: 'A fascia board, a paper bag, a shelf card, a phone screen. Black and white because a signwriter and a screen printer can both match it exactly, in one colour, for very little. The gradient stays rare partly because it is the one thing neither of them can.',
        },
        {
          label: 'Who the shop is for',
          body: 'Readers in Churchtown and the rest of Southport who would rather be told what to read by a person than by a recommendation engine.',
        },
        {
          label: 'What the shop is not',
          body: 'Not a gift shop that sells some books. Not a cafe.',
        },
      ],
      values: [
        {
          name: 'Read before recommended',
          body: 'Nobody here recommends a book they have not finished. It is slower, it limits what can go on the front table, and it is the reason people come back.',
        },
        {
          name: 'Small and chosen',
          body: 'Four hundred books the shop can vouch for beat four thousand it cannot. Shelf space is the scarcest thing in the building and it should be treated that way.',
        },
        {
          name: 'Part of Churchtown',
          body: 'Local writers, local schools, and whatever is happening on the village green. A shop that only talks about itself is a shop nobody talks about.',
        },
      ],
    },

    // ── 02 ──────────────────────────────────────────────────────────────────
    {
      type: 'logo',
      id: 'logo',
      title: 'The logo',
      nav: 'Logo',
      intro:
        'Two pieces that were made in deliberately different ways. The wordmark is typeset in EB Garamond and converted to outlines, so it stays legible down to a rubber stamp. The magpie is traced straight from the original drawing of the shopfront and has not been tidied up, because the wobble in the line is the only thing on this page that no other bookshop can copy.',
      lockups: [
        {
          src: './assets/logo.svg',
          alt: 'The Magpie’s Tale wordmark in black on white',
          label: 'Primary wordmark',
          note: 'Ink on white. The default everywhere. If in doubt, this one.',
          background: 'light',
        },
        {
          src: './assets/logo-reversed.svg',
          alt: 'The Magpie’s Tale wordmark reversed out of black',
          label: 'Reversed wordmark',
          note: 'White out of Ink. For the fascia, the tote and anything printed dark.',
          background: 'dark',
        },
        {
          src: './assets/logo-stacked.svg',
          alt: 'The magpie above The Magpie’s Tale wordmark',
          label: 'Stacked lockup',
          note: 'For square and near-square spaces: the stamp, a loyalty card, an ad slot.',
          background: 'light',
        },
        {
          src: './assets/magpie.svg',
          alt: 'The magpie on its own',
          label: 'The magpie alone',
          note: 'Social avatars, endpapers, the back of a bookmark. Only where the name is already obvious.',
          background: 'light',
        },
      ],
      clearspace: {
        src: './assets/clearspace.svg',
        alt: 'Diagram showing clear space of one cap height on all four sides of the wordmark',
        note: 'Keep one cap height clear on every side, measured off the T. That margin stays empty: no text, no rule, no photograph edge, no other logo. The dashed box is a guide and does not print.',
      },
      minSize: {
        note: 'Below these the thin strokes in Garamond start to break up, and the magpie loses the white flash on its wing. If the space is smaller than the minimum, use the magpie on its own rather than shrinking the wordmark further.',
        items: [
          { label: 'Wordmark, screen', value: '140 px wide' },
          { label: 'Wordmark, print', value: '34 mm wide' },
          { label: 'Stacked lockup, screen', value: '96 px wide' },
          { label: 'Magpie alone, screen', value: '28 px wide' },
        ],
      },
      misuse: [
        {
          src: './assets/misuse-stretch.svg',
          label: 'Stretched or squashed',
          note: 'Scale both dimensions together. Garamond is familiar enough that people notice when its proportions are off, even if they could not say why.',
        },
        {
          src: './assets/misuse-recolour.svg',
          label: 'Filled with the shimmer',
          note: 'The most tempting one on this page, and worth resisting. The shimmer belongs to the tail rather than the type. The wordmark stays Ink or white.',
        },
        {
          src: './assets/misuse-outline.svg',
          label: 'Outlined or shadowed',
          note: 'No outlines, shadows, bevels or glows. If it is not showing up, the background is usually the thing to change.',
        },
      ],
    },

    // ── 03 ──────────────────────────────────────────────────────────────────
    {
      type: 'colour',
      id: 'colour',
      title: 'Colour',
      nav: 'Colour',
      intro:
        'Two colours and one gradient. Ink and paper carry every piece the shop makes, and the shimmer appears about as often as the light really does catch a magpie. A piece with no colour at all is still on brand. Colour in two places on the same piece is usually one too many.',
      groups: [
        {
          label: 'Ink and paper',
          note: 'These two do most of the work. The rest of the palette is detail by comparison.',
          swatches: [
            {
              name: 'Ink',
              hex: '#0E0E0F',
              rgb: '14 14 15',
              cmyk: '0 0 0 100',
              use: 'Text, the wordmark, dark backgrounds. Print it as 100% K, not as a rich black.',
            },
            {
              name: 'Paper',
              hex: '#FFFFFF',
              rgb: '255 255 255',
              cmyk: '0 0 0 0',
              use: 'The background, everywhere. Plain white, not cream. The drawing was made on white paper.',
            },
          ],
        },
        {
          label: 'The shimmer',
          note: 'One colour, not three. It is shown as the gradient because that is the only form it takes; three chips side by side would suggest they can be used separately, and they cannot. The percentages are the stop positions, and the note in the next section explains how they were arrived at.',
          gradient: {
            angle: '90deg',
            stops: [
              {
                name: 'Shimmer Teal',
                hex: '#0B6E6E',
                at: 0,
                rgb: '11 110 110',
                cmyk: '87 32 46 12',
                use: 'The start of the sweep.',
              },
              {
                name: 'Shimmer Blue',
                hex: '#2A4E9B',
                at: 68,
                rgb: '42 78 155',
                cmyk: '86 65 0 9',
                use: 'The middle stop, and the one easiest to overlook. It sits at 68%, not halfway.',
              },
              {
                name: 'Shimmer Violet',
                hex: '#5C2E8E',
                at: 100,
                rgb: '92 46 142',
                cmyk: '73 89 0 6',
                use: 'The end of the sweep.',
              },
            ],
          },
        },
        {
          label: 'Tints of Ink',
          note: 'Not new colours. These are Ink at reduced strength, for the things that should be readable without competing with the text above them.',
          swatches: [
            {
              name: 'Ink 60',
              hex: '#6E6E6F',
              rgb: '110 110 111',
              use: 'Captions, prices, dates, the second line of anything.',
            },
            {
              name: 'Ink 12',
              hex: '#E2E2E2',
              rgb: '226 226 226',
              use: 'Hairlines and table rules. Too light for type.',
            },
          ],
        },
      ],
      pairings: [
        { label: 'Ink on Paper', fg: '#0E0E0F', bg: '#FFFFFF', note: 'Everything, by default.' },
        { label: 'Paper on Ink', fg: '#FFFFFF', bg: '#0E0E0F', note: 'The fascia, the tote, the bag.' },
        {
          label: 'Ink 60 on Paper',
          fg: '#6E6E6F',
          bg: '#FFFFFF',
          note: 'Captions and prices. This is as light as text should go.',
        },
        {
          label: 'Paper on Shimmer Teal',
          fg: '#FFFFFF',
          bg: '#0B6E6E',
          note: 'The weakest point of the sweep. White that clears it clears the whole gradient.',
        },
        {
          label: 'Paper on Shimmer Violet',
          fg: '#FFFFFF',
          bg: '#5C2E8E',
          note: 'The strongest point. Between these two, white is safe anywhere along the sweep.',
        },
      ],
    },

    // ── 04 ──────────────────────────────────────────────────────────────────
    {
      type: 'custom',
      id: 'shimmer',
      title: 'The shimmer',
      nav: 'Shimmer',
      intro:
        'The one piece of colour in the identity, and the one worth taking care over. A magpie is not teal. It is black, and it goes teal for a second when the light hits it at the right angle. The gradient works best when it behaves the same way: brief, and in one place. Spread across a whole background it stops reading as a magpie and starts reading as decoration.',
      html: `
<style>
  .sh-band { height: 76px; border-radius: 3px; }
  .sh-full { background: linear-gradient(90deg, #0B6E6E 0%, #2A4E9B 68%, #5C2E8E 100%); }
  .sh-bad  { background: linear-gradient(90deg, #0B6E6E 0%, #5C2E8E 100%); }
  .sh-caption { margin-top: 10px; font-size: 0.9375rem; color: var(--muted); }
  .sh-caption strong { color: var(--ink); font-weight: 400; font-style: italic; }
  .sh-code {
    margin: 0; padding: 18px 20px; background: #0E0E0F; color: #FFFFFF;
    border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.7;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .sh-code .c { color: #9A9A9B; }
  .sh-rule { height: 3px; border-radius: 2px; }
  .sh-demo { padding: 30px 32px; border: 1px solid var(--rule); border-radius: 3px; }
  .sh-demo h3 { font-size: 1.5rem; font-weight: 400; margin: 0 0 4px; }
  .sh-demo p { color: var(--muted); font-size: 0.9375rem; }
  .sh-swatchrow { display: flex; gap: 2px; margin-bottom: 10px; }
  .sh-swatchrow span { flex: 1; height: 34px; }
  @media (max-width: 700px) { .sh-band { height: 56px; } }
</style>

<div class="block">
  <p class="eyebrow block-label">The gradient</p>
  <div class="sh-band sh-full"></div>
  <p class="sh-caption">Teal to violet, left to right, with blue at 68%. This is the only form the
  colour ever takes.</p>
</div>

<div class="grid g2 block">
  <div>
    <div class="sh-band sh-full"></div>
    <p class="sh-caption"><strong>This.</strong> Three stops, with the blue at 68%. The sweep stays
    saturated the whole way across and changes at an even rate.</p>
  </div>
  <div>
    <div class="sh-band sh-bad"></div>
    <p class="sh-caption"><strong>Not this.</strong> Two stops. Teal and violet sit on opposite sides
    of the colour wheel, so the midpoint lands on <code>#344E7E</code>, a flat slate blue, and the
    sweep loses its colour through the middle.</p>
  </div>
</div>

<div class="block">
  <p class="eyebrow block-label">Why 68% and not half way</p>
  <p class="measure">Teal and blue are much further apart to the eye than blue and violet: in Lab,
  the first step measures about 56 and the second about 26. Put the blue at 50% and the sweep tears
  through the teal end and then crawls through the violet end. At 68% the two halves are the same
  perceptual size, so the colour changes at a steady rate the whole way across. It also leaves more
  teal in the bar, which is closer to how the sheen actually sits on the bird.</p>
</div>

<div class="block">
  <p class="eyebrow block-label">How to build it</p>
  <pre class="sh-code"><code><span class="c">/* The shimmer. All three stops, one direction, blue at 68%. */</span>
background: linear-gradient(90deg, #0B6E6E 0%, #2A4E9B 68%, #5C2E8E 100%);

<span class="c">/* As a rule or an underline, which is how it is used most often. */</span>
height: 3px;
background: linear-gradient(90deg, #0B6E6E 0%, #2A4E9B 68%, #5C2E8E 100%);

<span class="c">/* In print, same three stops at the same positions. */</span>
<span class="c">0%   C87 M32 Y46 K12</span>
<span class="c">68%  C86 M65 Y0  K9</span>
<span class="c">100% C73 M89 Y0  K6</span></code></pre>
</div>

<div class="block">
  <p class="eyebrow block-label">Where it is allowed</p>
  <div class="grid g2">
    <div class="sh-demo">
      <div class="sh-rule sh-full" style="margin-bottom:20px"></div>
      <h3>As a rule</h3>
      <p>A 2 to 4 px line under a heading, along the top of a page, or down the edge of a card like
      the stained edge of a book block. This is the default use and covers most jobs.</p>
    </div>
    <div class="sh-demo">
      <div style="display:inline-block;padding:11px 22px;border-radius:2px;color:#fff;background:linear-gradient(90deg,#0B6E6E 0%,#2A4E9B 68%,#5C2E8E 100%);margin-bottom:20px">Reserve a copy</div>
      <h3>Behind one button</h3>
      <p>One per page, on whichever thing matters most. White text only. A second shimmer button on
      the same page takes the emphasis away from the first.</p>
    </div>
  </div>
</div>

<div class="grid g2 block">
  <div class="rule-col tone-do">
    <div class="rule-col-head"><span class="rule-mark">+</span><span class="eyebrow" style="color:var(--ink)">Do</span></div>
    <ul>
      <li>Use it once per page, poster or post.</li>
      <li>Run it in a straight line, left to right or top to bottom.</li>
      <li>Keep all three stops, in order.</li>
      <li>Put white on it when it sits behind text.</li>
    </ul>
  </div>
  <div class="rule-col tone-dont">
    <div class="rule-col-head"><span class="rule-mark">&times;</span><span class="eyebrow" style="color:var(--ink)">Don’t</span></div>
    <ul>
      <li>Fill a whole background with it.</li>
      <li>Use one stop on its own as a flat colour.</li>
      <li>Make it radial, diagonal or animated.</li>
      <li>Put it behind or inside the wordmark.</li>
      <li>Set body text in any of the three colours.</li>
    </ul>
  </div>
</div>
`,
    },

    // ── 05 ──────────────────────────────────────────────────────────────────
    {
      type: 'type',
      id: 'type',
      title: 'Typography',
      nav: 'Typography',
      intro:
        'One family throughout. EB Garamond is a revival of the types Claude Garamont cut in Paris in the 1540s, which have set literary publishing ever since. A bookshop setting its own name in Garamond puts it in the same trade as the things on its shelves. A second typeface would dilute that, which is why there is only one here.',
      fonts: [
        {
          name: 'EB Garamond',
          role: 'Everything',
          stack: "'EB Garamond', Garamond, Georgia, serif",
          weights: ['Regular 400', 'Italic 400'],
          source: 'SIL Open Font Licence 1.1. Free for print and web, nothing to buy, no per-seat licence for a printer or signmaker. The web files carry small caps, and both oldstyle and lining figures.',
          specimen: 'The Magpie’s Tale',
          note: 'Regular sets everything. Italic does the work bold would do elsewhere.',
        },
        {
          name: 'EB Garamond Italic',
          role: 'Emphasis and titles',
          stack: "'EB Garamond', Garamond, Georgia, serif",
          italic: true,
          weights: ['Italic 400'],
          source: 'Included in the same download.',
          specimen: 'Wolf Hall, Hilary Mantel',
          note: 'Book titles take italic. That is the publishing convention anyway, so it costs nothing to be correct.',
        },
      ],
      scale: [
        {
          label: 'Display',
          size: '60px',
          lineHeight: '1.04',
          weight: '400',
          tracking: '-0.012em',
          font: 'EB Garamond',
          sample: 'Books somebody here has actually finished',
        },
        {
          label: 'Heading',
          size: '34px',
          lineHeight: '1.18',
          weight: '400',
          font: 'EB Garamond',
          sample: 'On the front table this month',
        },
        {
          label: 'Subheading',
          size: '22px',
          lineHeight: '1.4',
          weight: '400',
          font: 'EB Garamond Italic',
          sample: 'Fiction, nature writing, and one very odd cookbook',
        },
        {
          label: 'Body',
          size: '19px',
          lineHeight: '1.6',
          weight: '400',
          font: 'EB Garamond',
          sample:
            'Every card on these shelves was written by somebody who got to the end of the book. It is a slow way to run a bookshop and it is the only reason anyone asks us what to read next.',
        },
        {
          label: 'Small',
          size: '16px',
          lineHeight: '1.5',
          weight: '400',
          font: 'EB Garamond',
          sample: 'Paperback, 384 pages, £9.99',
        },
        {
          label: 'Label',
          size: '13px',
          lineHeight: '1.4',
          weight: '400',
          tracking: '0.11em',
          font: 'EB Garamond',
          sample: 'Staff pick, shelf four',
        },
      ],
      rules: [
        'Keep body text at 19px or larger on screen. Garamond has a small x-height, so it reads a full size smaller than a sans at the same measurement. At 16px it starts to go grey and hard to read, which is the most common way Garamond comes unstuck on the web.',
        'Use italic for emphasis, and for book titles. Bold is best left alone: EB Garamond’s bold was drawn centuries after the roman and sits awkwardly beside it.',
        'Set ragged right. Justified Garamond opens rivers of white down the column, which is worse than an uneven edge.',
        'Keep lines between 62 and 70 characters. Past that the eye loses the return.',
        "The shop’s name takes a curly apostrophe: The Magpie’s Tale rather than The Magpie's Tale. It is in the name, so it is worth the keystroke.",
        'Labels, eyebrows and buttons are set in small caps at 13px with 0.11em letterspacing, using the font’s own small caps rather than shrunken capitals. In CSS that is font-variant-caps: all-small-caps.',
        'Anything that is data rather than prose takes lining, tabular figures: prices, opening hours, phone numbers, dates, page counts. In CSS that is font-variant-numeric: lining-nums tabular-nums. Running prose keeps the oldstyle figures the font gives you by default, which is what makes numbers sit properly inside a sentence.',
      ],
    },

    // ── 06 ──────────────────────────────────────────────────────────────────
    {
      type: 'voice',
      id: 'voice',
      title: 'Tone of voice',
      nav: 'Voice',
      intro:
        'Write the way somebody behind the counter talks on a quiet Tuesday. Someone who has read a great deal and has no particular interest in you knowing that. Warm, dry, specific, and not selling.',
      principles: [
        {
          name: 'Say what it does, not how good it is',
          body: '"Four hundred pages about a hotel and not one dull one" tells a reader something they can act on. "Unmissable" tells them nothing, and they have read it a thousand times before.',
        },
        {
          name: 'Dry, not clever',
          body: 'A light touch is welcome. A pun that draws attention to itself is less so. If a line makes the writer look good rather than the book sound worth reading, it can usually go.',
        },
        {
          name: 'Write it the way you would say it',
          body: 'Contractions, mostly. "If we haven’t got it" is what somebody behind the counter actually says; "if we have not got it" is what a form letter says. The shop sounds like a person or it sounds like a chain.',
        },
        {
          name: 'Stop earlier than feels right',
          body: 'A shelf card is about twenty five words. An event listing is two sentences. The temptation is to add one more clause, and the writing is usually better without it.',
        },
      ],
      examples: [
        {
          context: 'Shelf card',
          yes: 'A novel about grief that’s somehow very funny. Start it on a day you’ve nothing on.',
          no: 'An unmissable emotional rollercoaster that will stay with you long after the final page!',
        },
        {
          context: 'Instagram',
          yes: 'Restocked at last. It took four months and two increasingly rude emails.',
          no: 'BACK IN STOCK! 🔥 Get yours before they’re gone!! 📚✨',
        },
        {
          context: 'Event listing',
          yes: 'Thursday, 7pm. Twenty chairs, one author, and wine that’s better than it needs to be.',
          no: 'Join us for an unforgettable evening celebrating the transformative power of storytelling.',
        },
        {
          context: 'Out of stock',
          yes: 'Gone, sorry. We can have it here by Thursday if you want it putting aside.',
          no: 'We apologise for any inconvenience caused by the current unavailability of this item.',
        },
        {
          context: 'Closed for the day',
          yes: 'Shut today. Back at ten tomorrow.',
          no: 'We are currently closed but look forward to welcoming you back very soon!',
        },
      ],
      lexicon: {
        use: [
          'bookshop',
          'reader',
          'shelf card',
          'we have read it',
          'order it in',
          'putting one aside',
          'secondhand',
          'Churchtown',
        ],
        avoid: [
          'bookstore',
          'curated',
          'literary journey',
          'must-read',
          'unmissable',
          'page-turner',
          'hidden gem',
          'nestled',
          'customers',
        ],
      },
    },

    // ── 07 ──────────────────────────────────────────────────────────────────
    {
      type: 'custom',
      id: 'illustration',
      title: 'Illustration',
      nav: 'Illustration',
      intro:
        'Two different drawing styles, and this section is about giving each one its own space. The shopfront is the shop’s own drawing: flat, open and unfussy. The spot illustrations are a supporting set in a more formal engraving style. Both are useful. At similar sizes they compete, and the shopfront comes off worse, so the rule below is about size rather than taste.',
      html: `
<style>
  .il-hero { border: 1px solid var(--rule); border-radius: 3px; padding: 30px; text-align: center; }
  .il-hero img { margin: 0 auto; max-width: 460px; width: 100%; }
  .il-cap { margin-top: 18px; font-size: 0.9375rem; color: var(--muted); }
  .il-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
  .il-sp { border: 1px solid var(--rule); border-radius: 3px; padding: 14px; display: grid; place-items: center; }
  .il-sp img { width: 100%; max-width: 118px; }
  @media (max-width: 760px) { .il-grid { grid-template-columns: repeat(3, 1fr); } }
  .il-vs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .il-card { border: 1px solid var(--rule); border-radius: 3px; overflow: hidden; }
  .il-card-top { padding: 26px; display: flex; align-items: flex-end; justify-content: center; gap: 22px; min-height: 190px; }
  .il-card-foot { padding: 13px 16px; border-top: 1px solid var(--rule); font-size: 0.875rem; color: var(--muted); }
  .il-card-foot strong { display: block; color: var(--ink); font-weight: 400; font-style: italic; margin-bottom: 2px; }
  @media (max-width: 760px) { .il-vs { grid-template-columns: 1fr; } }
</style>

<div class="block">
  <p class="eyebrow block-label">The primary illustration</p>
  <div class="il-hero">
    <img src="./assets/shopfront.webp" alt="Pen drawing of the shopfront with a magpie on the roof" loading="lazy">
    <p class="il-cap">The shop’s own drawing. It is the origin of the whole identity and the one
    image nobody else can use. It goes large, on white, on its own.</p>
  </div>
</div>

<div class="block">
  <p class="eyebrow block-label">The spot set</p>
  <p class="measure" style="margin-bottom:18px">A supporting set for section marks and headers. The
  line is finer and more worked than the shopfront, which is exactly why they only ever appear
  small. Below about 160&nbsp;px the hatching reads as texture instead of as a second illustrator.</p>
  <div class="il-grid">
    <div class="il-sp"><img src="./assets/spots/magpie-perched.webp" alt="Magpie perched on a twig" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/books-stack.webp" alt="A stack of books" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/wine-and-books.webp" alt="A glass of wine beside two books" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/church-tower.webp" alt="A parish church tower" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/tea-and-book.webp" alt="A teapot and mug on books" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/magpie-feather.webp" alt="A single tail feather" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/armchair.webp" alt="A reading armchair" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/spectacles.webp" alt="Reading glasses on an open book" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/tote-bag.webp" alt="A cotton tote bag" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/magpie-flight.webp" alt="A magpie in flight" loading="lazy"></div>
    <div class="il-sp"><img src="./assets/spots/magpie-treasure.webp" alt="A magpie holding a ring in its beak" loading="lazy"></div>
  </div>
</div>

<div class="block">
  <p class="eyebrow block-label">The size rule, and why it exists</p>
  <div class="il-vs">
    <div class="il-card">
      <div class="il-card-top">
        <img src="./assets/spots/books-stack.webp" alt="" style="width:96px" loading="lazy">
        <img src="./assets/spots/magpie-perched.webp" alt="" style="width:96px" loading="lazy">
      </div>
      <div class="il-card-foot"><strong>This</strong>Spots kept small and used together. One style on
      the page, reading as texture beside the type.</div>
    </div>
    <div class="il-card">
      <div class="il-card-top">
        <img src="./assets/shopfront.webp" alt="" style="width:172px" loading="lazy">
        <img src="./assets/spots/books-stack.webp" alt="" style="width:150px" loading="lazy">
      </div>
      <div class="il-card-foot"><strong>Not this</strong>The shopfront next to a spot at a similar
      size. The two styles pull against each other, and the shopfront reads as the weaker of the
      two when it is simply the plainer one.</div>
    </div>
  </div>
</div>

<div class="grid g2 block">
  <div class="rule-col tone-do">
    <div class="rule-col-head"><span class="rule-mark">+</span><span class="eyebrow" style="color:var(--ink)">Do</span></div>
    <ul>
      <li>Keep spot illustrations under 160 px on screen, and under 40 mm in print.</li>
      <li>Use one spot per section, as a mark beside a heading.</li>
      <li>Let the shopfront be the only illustration on any piece it appears on.</li>
      <li>Keep them pure black on white, like everything else.</li>
    </ul>
  </div>
  <div class="rule-col tone-dont">
    <div class="rule-col-head"><span class="rule-mark">&times;</span><span class="eyebrow" style="color:var(--ink)">Don’t</span></div>
    <ul>
      <li>Put a spot and the shopfront on the same page at similar sizes.</li>
      <li>Blow a spot up to fill a hero, a poster or a window.</li>
      <li>Scatter four or five spots across one page.</li>
      <li>Add a new spot in a third style. A new one is best commissioned to match either the shopfront or the spot set.</li>
    </ul>
  </div>
</div>
`,
    },

    // ── 08 ──────────────────────────────────────────────────────────────────
    {
      type: 'custom',
      id: 'applications',
      title: 'The brand applied',
      nav: 'Applications',
      intro:
        'The four things the shop makes most. Once these are right the rest tends to follow the same logic: white paper, black type, and one piece of colour where it earns its place.',
      html: `
<style>
  .ap { border: 1px solid var(--rule); border-radius: 3px; overflow: hidden; }
  .ap-stage { padding: 34px 30px; min-height: 210px; display: flex; flex-direction: column; justify-content: center; }
  .ap-foot { padding: 14px 18px; border-top: 1px solid var(--rule); font-size: 0.875rem; color: var(--muted); }
  .ap-foot strong { display: block; color: var(--ink); font-weight: 400; font-style: italic; margin-bottom: 2px; }
  .ap-label { font-size: 0.6875rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }
  .ap-dark { background: #0E0E0F; color: #fff; }
  .ap-dark .ap-label { color: rgba(255,255,255,0.55); }
  .ap-word { font-size: 1.75rem; line-height: 1.1; }
  .ap-shim { height: 3px; background: linear-gradient(90deg,#0B6E6E 0%,#2A4E9B 68%,#5C2E8E 100%); }
  .ap-price { color: var(--muted); font-size: 0.9375rem; }
  @media (max-width: 700px) { .ap-stage { min-height: 0; } }
</style>

<div class="grid g2">

  <div class="ap">
    <div class="ap-stage">
      <div class="ap-label" style="margin-bottom:14px">Staff pick, shelf four</div>
      <div style="font-size:1.375rem;line-height:1.3;margin-bottom:10px"><em>The Bee Sting</em><br>Paul Murray</div>
      <p style="font-size:1rem;line-height:1.55;margin:0 0 14px">A family falling apart over six hundred pages, and I resented every interruption. Take it on holiday.</p>
      <div class="ap-price">Paperback · £9.99</div>
    </div>
    <div class="ap-foot"><strong>Shelf card</strong>A5, white card, black ink only. No colour here:
    there are dozens of these around the shop, and the shimmer works because it is rare.</div>
  </div>

  <div class="ap">
    <div class="ap-stage ap-dark" style="align-items:center;text-align:center">
      <div class="ap-word" style="font-family:var(--font-display)">The Magpie’s Tale</div>
      <div class="ap-label" style="margin-top:12px">Churchtown · Southport</div>
    </div>
    <div class="ap-foot"><strong>Tote and paper bag</strong>Reversed wordmark, one colour, screen
    printed. No strapline, no web address and no shimmer: the name on its own carries it.</div>
  </div>

  <div class="ap">
    <div class="ap-shim"></div>
    <div class="ap-stage">
      <div class="ap-label" style="margin-bottom:12px">Thursday 4 September, 7pm</div>
      <div style="font-size:1.5rem;line-height:1.2;margin-bottom:10px">An evening with<br>a local author</div>
      <p style="font-size:1rem;line-height:1.55;margin:0">Twenty chairs, one author, and wine that is
      better than it needs to be. Free, but tell us you are coming.</p>
    </div>
    <div class="ap-foot"><strong>Event poster</strong>The piece that earns its colour: a single
    shimmer rule across the top, with everything below it black on white.</div>
  </div>

  <div class="ap">
    <div class="ap-stage" style="align-items:center;justify-content:center">
      <img src="./assets/magpie.svg" alt="The magpie" style="width:62%;max-width:220px" loading="lazy">
    </div>
    <div class="ap-foot"><strong>Social avatar and stamp</strong>The magpie on its own, black on
    white. The name is already next to it in every place this appears.</div>
  </div>

</div>

<div class="grid g2 block">
  <div class="rule-col tone-do">
    <div class="rule-col-head"><span class="rule-mark">+</span><span class="eyebrow" style="color:var(--ink)">Do</span></div>
    <ul>
      <li>Leave more white space than feels necessary. It is a large part of the identity.</li>
      <li>Photograph the actual shop, in daylight, against the actual shelves.</li>
      <li>Let the drawing of the shopfront do the work on anything that needs an image.</li>
      <li>Print black on white stock. Uncoated, and not cream.</li>
    </ul>
  </div>
  <div class="rule-col tone-dont">
    <div class="rule-col-head"><span class="rule-mark">&times;</span><span class="eyebrow" style="color:var(--ink)">Don’t</span></div>
    <ul>
      <li>Put the wordmark and the magpie on the same face of anything. One or the other reads better.</li>
      <li>Use stock photography of artfully stacked books. Pictures of the actual shop always do more.</li>
      <li>Add a second colour for Christmas or World Book Day. Black and white holds up all year.</li>
      <li>Set the shop name in anything other than Garamond, including in an email signature.</li>
    </ul>
  </div>
</div>
`,
    },

    // ── 09 ──────────────────────────────────────────────────────────────────
    {
      type: 'rules',
      id: 'checklist',
      title: 'Before it goes out',
      nav: 'Checklist',
      intro:
        'A thirty-second pass that catches most things. It is the shop’s brand, so nothing here needs anyone’s permission. This is just the list of things that are easy to miss and annoying to reprint.',
      columns: [
        {
          label: 'Worth checking',
          tone: 'do',
          items: [
            'Background is white rather than cream or off-white.',
            'The logo has a full cap height clear on all four sides.',
            'Everything is set in EB Garamond.',
            'Body text is 19px or larger on screen, 10pt or larger in print.',
            'Emphasis is italic rather than bold.',
            'The apostrophe in the shop name is curly.',
          ],
        },
        {
          label: 'Easy to get wrong',
          tone: 'dont',
          items: [
            'More than one shimmer element in the same piece.',
            'A shimmer colour used flat, without the gradient.',
            'The wordmark stretched, outlined, shadowed or recoloured.',
            'Exclamation marks, which the shop’s voice rarely needs.',
            'Emoji in shop copy.',
            'A second typeface slipping in for a one-off.',
          ],
        },
        {
          label: 'Happy to help with',
          tone: 'note',
          items: [
            'Co-branding with a publisher, a festival or another shop.',
            'The logo on merchandise that is being sold rather than given away.',
            'Anything printed larger than A1, including the window.',
            'A one-off campaign that seems to want a new colour. There is usually a way to do it in black and white.',
          ],
        },
      ],
    },

    // ── 10 ──────────────────────────────────────────────────────────────────
    {
      type: 'assets',
      id: 'downloads',
      title: 'Downloads',
      nav: 'Downloads',
      intro:
        'Everything a printer, a signmaker or a collaborator is likely to ask for. When somebody asks for "the logo", the pack is usually more useful than a screenshot from this page, and it tends to save a reprint.',
      groups: [
        {
          label: 'Logos',
          files: [
            {
              name: 'Full logo pack',
              href: './assets/downloads/magpiestale-logos.zip',
              format: 'ZIP',
              note: 'Every lockup in SVG, black and reversed, plus the shopfront drawing.',
            },
            {
              name: 'Primary wordmark',
              href: './assets/logo.svg',
              format: 'SVG',
              note: 'Outlined, so it needs no font installed. Scales to any size.',
            },
            {
              name: 'Reversed wordmark',
              href: './assets/logo-reversed.svg',
              format: 'SVG',
              note: 'White, for dark backgrounds.',
            },
            {
              name: 'Stacked lockup',
              href: './assets/logo-stacked.svg',
              format: 'SVG',
              note: 'Magpie above the wordmark, for square spaces.',
            },
            {
              name: 'The magpie',
              href: './assets/magpie.svg',
              format: 'SVG',
              note: 'Traced from the original drawing. Avatars, stamps, endpapers.',
            },
          ],
        },
        {
          label: 'Typeface',
          files: [
            {
              name: 'EB Garamond, roman and italic',
              href: './assets/downloads/magpiestale-fonts.zip',
              format: 'ZIP',
              note: 'Web files, subset to the characters the shop needs. Open Font Licence, so a printer can install it without buying anything. For desktop use, the full family is on Google Fonts.',
            },
          ],
        },
        {
          label: 'Illustration',
          files: [
            {
              name: 'The shopfront',
              href: './assets/shopfront.webp',
              format: 'WEBP',
              note: 'The original drawing, cleaned to pure black and white. 23 KB.',
            },
            {
              name: 'Spot illustrations',
              href: './assets/downloads/magpiestale-illustrations.zip',
              format: 'ZIP',
              note: 'The eleven spot drawings plus the shopfront. Read the size rule in the illustration section before using any of them.',
            },
          ],
        },
      ],
    },
  ],
};
