/**
 * Generates the embeddable carbon rating badges into public/badge/.
 *
 *   node scripts/build-badges.mjs
 *
 * Run this when the badge design changes and commit the output — the site is
 * static-output, so there is no runtime to render them on demand.
 *
 * Text is vectorised to paths (satori's embedFont), which is the whole point:
 * the badge is an <img> on somebody else's site, so it can never load our
 * webfonts. Paths render byte-identically on every browser and OS with no
 * external requests, and no dependency on what fonts the host site happens to
 * have. PNG copies exist because Wix and Squarespace both reject SVG uploads
 * in places, and a meaningful share of these sites are on one or the other.
 *
 * Badges carry the grade only, never the gram figure. A static file cannot
 * stay truthful about a number that changes every time the site is edited,
 * and the link goes to a live re-audit where the current figure is measured
 * fresh. Grade-only is the honest granularity.
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { BADGE_GRADES, GRADE_COLORS, badgeSlug } from '../src/lib/carbon.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'badge');
const nodeModules = path.join(ROOT, 'node_modules');

const font = (file) => fs.readFileSync(path.join(nodeModules, '@fontsource', file));
const FONTS = [
  { name: 'Work Sans', data: font('work-sans/files/work-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Work Sans', data: font('work-sans/files/work-sans-latin-500-normal.woff'), weight: 500, style: 'normal' },
  { name: 'Work Sans', data: font('work-sans/files/work-sans-latin-600-normal.woff'), weight: 600, style: 'normal' },
  { name: 'Work Sans', data: font('work-sans/files/work-sans-latin-700-normal.woff'), weight: 700, style: 'normal' },
];

const WIDTH = 200;
const HEIGHT = 56;
const FONT_STACK = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif';

const THEMES = {
  light: { bg: '#F5F0E8', border: '#D6D1C8', ink: '#1F2319', muted: 'rgba(31, 35, 25, 0.58)', brand: '#1A5C12' },
  dark: { bg: '#1F2319', border: 'rgba(245, 240, 232, 0.18)', ink: '#F5F0E8', muted: 'rgba(245, 240, 232, 0.62)', brand: '#8FC47F' },
};

function template(grade, theme) {
  const t = THEMES[theme];
  // The chip keeps the grade's own band colour in both themes so an F could
  // never be mistaken for an A at a glance. On dark it needs a lighter face.
  const chipBg = theme === 'dark' ? '#F5F0E8' : GRADE_COLORS[grade];
  const chipInk = theme === 'dark' ? GRADE_COLORS[grade] : '#F5F0E8';

  return {
    type: 'div',
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 14px',
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: '10px',
        fontFamily: 'Work Sans',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: '36px',
              height: '36px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: chipBg,
              borderRadius: '8px',
              color: chipInk,
              fontSize: grade.length > 1 ? '17px' : '21px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
            },
            children: grade,
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '8.5px',
                    fontWeight: 500,
                    letterSpacing: '1.4px',
                    color: t.muted,
                    marginBottom: '3px',
                  },
                  children: 'CARBON RATING',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: '5px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '7px',
                          height: '7px',
                          background: t.brand,
                          transform: 'rotate(45deg)',
                        },
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '13px', fontWeight: 600, color: t.ink, letterSpacing: '-0.2px' },
                        children: 'oakfox.co.uk',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * The SVG is hand-authored against a system font stack rather than vectorised
 * from satori. Vectorising gives byte-perfect brand fonts but costs ~10 KB
 * (3.3 KB gzipped) in glyph outlines, and shipping a heavy asset to advertise
 * a light page is an argument against ourselves — a badge holder could fairly
 * point out that our badge is the biggest thing on their footer. This is under
 * a kilobyte. The cost is that the type renders in the visitor's system font
 * instead of Work Sans, which nobody has ever noticed on a badge.
 *
 * Layout is fixed-coordinate on a 200x56 canvas, with the text left-anchored
 * and ~50px of clear space to its right, so the widest system font can vary
 * without colliding with the edge.
 */
function badgeSvg(grade, theme) {
  const t = THEMES[theme];
  const chipBg = theme === 'dark' ? '#F5F0E8' : GRADE_COLORS[grade];
  const chipInk = theme === 'dark' ? GRADE_COLORS[grade] : '#F5F0E8';
  const wide = grade.length > 1;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">`,
    `<rect x=".5" y=".5" width="199" height="55" rx="10" fill="${t.bg}" stroke="${t.border}"/>`,
    `<rect x="14" y="10" width="36" height="36" rx="8" fill="${chipBg}"/>`,
    `<g font-family="${FONT_STACK}">`,
    `<text x="32" y="${wide ? 34 : 35.5}" font-size="${wide ? 17 : 21}" font-weight="700"`,
    ` letter-spacing="-.5" text-anchor="middle" fill="${chipInk}">${grade === 'A+' ? 'A+' : grade}</text>`,
    `<text x="60" y="24" font-size="8.5" font-weight="500" letter-spacing="1.4" fill="${t.muted}">CARBON RATING</text>`,
    `<path d="M63.5 31.8 67 35.3 63.5 38.8 60 35.3Z" fill="${t.brand}"/>`,
    `<text x="71" y="40" font-size="13" font-weight="600" letter-spacing="-.2" fill="${t.ink}">oakfox.co.uk</text>`,
    `</g></svg>`,
  ].join('');
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const written = [];
for (const grade of BADGE_GRADES) {
  for (const theme of Object.keys(THEMES)) {
    const stem = `carbon-${badgeSlug(grade)}${theme === 'dark' ? '-dark' : ''}`;

    const svg = badgeSvg(grade, theme);
    fs.writeFileSync(path.join(OUT_DIR, `${stem}.svg`), svg);
    written.push([`${stem}.svg`, Buffer.byteLength(svg)]);

    // The PNG goes through satori so it carries the real Work Sans outlines —
    // rasterising is font-independent by nature, so there is no size penalty
    // for using the brand face here. 2x keeps it crisp on retina without
    // asking the host site for any CSS.
    const brandSvg = await satori(template(grade, theme), {
      width: WIDTH,
      height: HEIGHT,
      fonts: FONTS,
      embedFont: true,
    });
    const png = new Resvg(brandSvg, { fitTo: { mode: 'width', value: WIDTH * 2 } }).render().asPng();
    fs.writeFileSync(path.join(OUT_DIR, `${stem}.png`), png);
    written.push([`${stem}.png`, png.byteLength]);
  }
}

for (const [name, bytes] of written) {
  console.log(`  ${name.padEnd(26)} ${(bytes / 1024).toFixed(1)} KB`);
}
console.log(`\n${written.length} files -> public/badge/`);
