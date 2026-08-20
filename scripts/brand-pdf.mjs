#!/usr/bin/env node
/**
 * Render a built brand-guidelines page to a real PDF file.
 *
 *   npm run build
 *   npm run brand:pdf -- themagpiestale
 *
 * Writes `public/brand/<slug>/guidelines.pdf`. Set `pdf: 'guidelines.pdf'` in
 * that client's data file and the Download button links straight to it; leave
 * it unset and the button opens the browser print dialogue instead. Either way
 * the next `npm run build` copies the file into `dist/`.
 *
 * This drives the copy of Chrome already installed on the machine rather than
 * pulling in Playwright or Puppeteer — a ~150 MB dependency to print one page a
 * few times a year is a poor trade, and the print CSS is doing all the real
 * work anyway. Override the binary with CHROME_PATH if yours lives elsewhere.
 *
 * The page loads over file:// straight out of dist/, so nothing needs serving.
 * Relative asset paths resolve; the webfont stylesheet still comes over the
 * network, so run this online or the PDF sets in the fallback stack.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];

if (!slug) {
  console.error('Usage: npm run brand:pdf -- <slug>');
  process.exit(1);
}

const source = path.join(root, 'dist/brand', slug, 'index.html');
if (!fs.existsSync(source)) {
  console.error(`No build output at ${path.relative(root, source)} — run "npm run build" first.`);
  process.exit(1);
}

const candidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const chrome = candidates.find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('No Chrome/Chromium found. Install Chrome, or set CHROME_PATH to the binary.');
  process.exit(1);
}

const outDir = path.join(root, 'public/brand', slug);
const out = path.join(outDir, 'guidelines.pdf');
fs.mkdirSync(outDir, { recursive: true });

execFileSync(
  chrome,
  [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    // Webfonts and the ambient gradients need a moment; virtual time lets the
    // renderer fast-forward to a settled page instead of us guessing a delay.
    '--virtual-time-budget=15000',
    `--print-to-pdf=${out}`,
    pathToFileURL(source).href,
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] }
);

if (!fs.existsSync(out)) {
  console.error('Chrome exited without writing a PDF.');
  process.exit(1);
}

const kb = Math.round(fs.statSync(out).size / 1024);
console.log(`Wrote ${path.relative(root, out)} (${kb} KB)`);
console.log(`If it is not already set, add \`pdf: 'guidelines.pdf'\` to src/data/brands/${slug}.ts and rebuild.`);
