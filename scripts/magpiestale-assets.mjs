/**
 * Builds the logo family for The Magpie's Tale.
 *
 * Two sources, kept deliberately separate:
 *   • the wordmark is typeset in EB Garamond and converted to outlines
 *   • the magpie is traced from the client's own pen drawing of the shopfront
 *
 * That split is the whole identity: hand-drawn where warmth helps, typeset
 * where legibility has to survive a 20mm stamp. Nothing here is redrawn by
 * hand in a vector editor, so re-running this reproduces the files exactly.
 *
 * Both outlines live in `scripts/magpiestale-paths.json`, already flattened, so
 * this build needs neither Python nor potrace installed.
 *
 *   node scripts/magpiestale-assets.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/brand/magpiestale/assets');
const SRC = join(ROOT, 'scripts/magpiestale-paths.json');

const INK = '#0E0E0F';
const PAPER = '#FFFFFF';

const { wordmark, magpie } = JSON.parse(readFileSync(SRC, 'utf8'));

/** Wrap path data in a minimal, accessible SVG. */
const svg = ({ w, h, d, fill, label, extra = '' }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">` +
  `<title>${label}</title>${extra}<path fill="${fill}" d="${d}"/></svg>\n`;

const write = (name, content) => {
  writeFileSync(join(OUT, name), content);
  console.log(`  ${name.padEnd(28)} ${(content.length / 1024).toFixed(1)} KB`);
};

console.log('The Magpie\'s Tale: logo family');

// ── Wordmark ────────────────────────────────────────────────────────────────
write('logo.svg', svg({ ...wordmark, fill: INK, label: "The Magpie's Tale" }));
write('logo-reversed.svg', svg({ ...wordmark, fill: PAPER, label: "The Magpie's Tale" }));

// ── Magpie, traced from the shopfront drawing ───────────────────────────────
write('magpie.svg', svg({ ...magpie, fill: INK, label: 'Magpie' }));
write('magpie-reversed.svg', svg({ ...magpie, fill: PAPER, label: 'Magpie' }));

// ── Stacked lockup: magpie sitting above the wordmark ───────────────────────
// The magpie is set to 56% of the wordmark's width and centred over it, with a
// gap of one cap height. Anything tighter and the tail crowds the ascenders.
const stacked = (fill) => {
  const gap = wordmark.h * 0.62;
  const mW = wordmark.w * 0.56;
  const mH = (magpie.h / magpie.w) * mW;
  const mX = (wordmark.w - mW) / 2;
  const total = mH + gap + wordmark.h;
  const s = mW / magpie.w;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wordmark.w} ${total.toFixed(1)}" ` +
    `role="img" aria-label="The Magpie's Tale"><title>The Magpie's Tale</title>` +
    `<g transform="translate(${mX.toFixed(1)} 0) scale(${s.toFixed(4)})">` +
    `<path fill="${fill}" d="${magpie.d}"/></g>` +
    `<g transform="translate(0 ${(mH + gap).toFixed(1)})">` +
    `<path fill="${fill}" d="${wordmark.d}"/></g></svg>\n`
  );
};
write('logo-stacked.svg', stacked(INK));
write('logo-stacked-reversed.svg', stacked(PAPER));

// ── Favicon ─────────────────────────────────────────────────────────────────
// The whole bird, tail included, sitting in a band across the square. Cropping
// to the body reads better as a shape but stops reading as a magpie: the tail
// is the recognisable half. Checked at 32px, where the silhouette still holds.
const favicon = () => {
  const box = 64;
  const s = (box * 0.9) / magpie.w;
  const dy = (box - magpie.h * s) / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" role="img" aria-label="The Magpie's Tale">` +
    `<title>The Magpie's Tale</title><rect width="${box}" height="${box}" fill="${PAPER}"/>` +
    `<g transform="translate(${(box * 0.05).toFixed(2)} ${dy.toFixed(2)}) scale(${s.toFixed(4)})">` +
    `<path fill="${INK}" d="${magpie.d}"/></g></svg>\n`
  );
};
write('favicon.svg', favicon());

// ── Clear space diagram ─────────────────────────────────────────────────────
// Measured in cap height, marked as "h" on the diagram, because that is the one
// unit somebody eyeballing a poster can actually find on the logo itself.
const clearspace = () => {
  const cap = wordmark.h * 0.72;
  const pad = cap;
  const w = wordmark.w + pad * 2;
  const h = wordmark.h + pad * 2;
  const dash = `stroke="${INK}" stroke-width="${cap * 0.045}" stroke-dasharray="${cap * 0.16} ${cap * 0.12}" fill="none" opacity="0.55"`;
  const tick = `stroke="${INK}" stroke-width="${cap * 0.045}" opacity="0.55"`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" ` +
    `role="img" aria-label="Clear space equal to one cap height on all four sides">` +
    `<title>Clear space</title><rect width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${PAPER}"/>` +
    `<rect x="${(pad / 2).toFixed(0)}" y="${(pad / 2).toFixed(0)}" width="${(w - pad).toFixed(0)}" height="${(h - pad).toFixed(0)}" ${dash}/>` +
    `<g transform="translate(${pad.toFixed(0)} ${pad.toFixed(0)})"><path fill="${INK}" d="${wordmark.d}"/></g>` +
    `<line x1="${(pad / 2).toFixed(0)}" y1="${(pad * 0.55).toFixed(0)}" x2="${pad.toFixed(0)}" y2="${(pad * 0.55).toFixed(0)}" ${tick}/>` +
    `</svg>\n`
  );
};
write('clearspace.svg', clearspace());

// ── Misuse diagrams ─────────────────────────────────────────────────────────
// Each one shows the actual wordmark doing the actual wrong thing, because a
// written rule about stretching is far easier to ignore than a picture of it.
const stage = (inner, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wordmark.w} ${(wordmark.h * 1.9).toFixed(0)}" role="img" aria-label="${label}">` +
  `<title>${label}</title><rect width="${wordmark.w}" height="${(wordmark.h * 1.9).toFixed(0)}" fill="${PAPER}"/>${inner}</svg>\n`;

write(
  'misuse-stretch.svg',
  stage(
    `<g transform="translate(0 ${(wordmark.h * 0.2).toFixed(0)}) scale(1 1.62)"><path fill="${INK}" d="${wordmark.d}"/></g>`,
    'Do not stretch the wordmark'
  )
);
write(
  'misuse-recolour.svg',
  stage(
    `<defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0" stop-color="#0B6E6E"/><stop offset="0.68" stop-color="#2A4E9B"/><stop offset="1" stop-color="#5C2E8E"/>` +
      `</linearGradient></defs>` +
      `<g transform="translate(0 ${(wordmark.h * 0.45).toFixed(0)})"><path fill="url(#s)" d="${wordmark.d}"/></g>`,
    'Do not fill the wordmark with the shimmer'
  )
);
write(
  'misuse-outline.svg',
  stage(
    `<g transform="translate(0 ${(wordmark.h * 0.45).toFixed(0)})">` +
      `<path fill="none" stroke="${INK}" stroke-width="${(wordmark.h * 0.012).toFixed(1)}" d="${wordmark.d}"/></g>`,
    'Do not outline the wordmark'
  )
);

console.log('Done.');
