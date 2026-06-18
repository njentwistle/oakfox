#!/usr/bin/env node
// IndexNow submitter for oakfox.co.uk (static Astro site).
//
// Why a script and not a runtime hook: OakFox has no server. Content is
// Markdown in git, published by pushing to `main` (build -> deploy branch ->
// cPanel). So the natural "publish event" is a deploy, and the canonical set
// of LIVE urls is the freshly-built sitemap (it already excludes drafts,
// future-dated posts, /dashboard and /og). We never re-implement routing —
// the sitemap is the source of truth.
//
// Usage:
//   node scripts/indexnow.mjs --all                     # ping every live url
//   node scripts/indexnow.mjs --changed <base> <head>   # ping only urls whose
//                                                        # source changed in a
//                                                        # commit range
//   node scripts/indexnow.mjs --dry                      # print, don't POST
//
// In CI the deploy workflow runs `--changed` so a CSS-only commit doesn't
// resubmit the whole site. Run `--all` once by hand for the initial submission.

import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const HOST = 'oakfox.co.uk';
const ORIGIN = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const DIST = 'dist';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');

// ---- key: the single 64-hex-or-less .txt file in public/ is the ownership key
function loadKey() {
  const files = readdirSync('public').filter((f) => /^[a-f0-9]{8,}\.txt$/.test(f));
  if (files.length !== 1) {
    throw new Error(
      `Expected exactly one IndexNow key file (public/<hex>.txt), found ${files.length}: ${files.join(', ')}`,
    );
  }
  const key = readFileSync(join('public', files[0]), 'utf8').trim();
  return { key, keyLocation: `${ORIGIN}/${files[0]}` };
}

// ---- read every <loc> out of the built sitemap(s)
function sitemapUrls() {
  const indexPath = join(DIST, 'sitemap-index.xml');
  const index = readFileSync(indexPath, 'utf8');
  const childUrls = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = new Set();
  for (const child of childUrls) {
    // child is an absolute url like https://oakfox.co.uk/sitemap-0.xml ->
    // read it from dist by filename.
    const file = child.split('/').pop();
    const xml = readFileSync(join(DIST, file), 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1]);
  }
  return [...urls];
}

// ---- map a changed source file to its public url (best-effort)
// Only used to FILTER the sitemap, so anything that maps to a non-live url is
// silently dropped — we never invent urls that aren't in the sitemap.
function sourceFileToUrl(file) {
  // blog / portfolio content collections: src/content/<coll>/<slug>.(md|mdx)
  let m = file.match(/^src\/content\/(blog|portfolio)\/(.+)\.mdx?$/);
  if (m) return `${ORIGIN}/${m[1]}/${m[2]}`;
  // static pages: src/pages/<path>.astro  (index -> dir root)
  m = file.match(/^src\/pages\/(.+)\.astro$/);
  if (m) {
    let p = m[1];
    if (p.endsWith('/index')) p = p.slice(0, -'/index'.length);
    if (p === 'index') p = '';
    return p ? `${ORIGIN}/${p}` : `${ORIGIN}/`;
  }
  return null;
}

function changedUrls(base, head) {
  const range = base && head ? `${base} ${head}` : 'HEAD~1 HEAD';
  let out;
  try {
    out = execSync(`git diff --name-only ${range}`, { encoding: 'utf8' });
  } catch (err) {
    console.warn(`[indexnow] git diff failed (${err.message}); nothing to ping.`);
    return [];
  }
  const changed = out.split('\n').filter(Boolean);
  const live = new Set(sitemapUrls());
  // normalise trailing slashes when intersecting
  const norm = (u) => u.replace(/\/$/, '');
  const liveNorm = new Map([...live].map((u) => [norm(u), u]));
  const hits = new Set();
  for (const f of changed) {
    const url = sourceFileToUrl(f);
    if (url && liveNorm.has(norm(url))) hits.add(liveNorm.get(norm(url)));
  }
  // a change to a shared layout/component/style can affect every page; in that
  // case fall back to nothing rather than spamming — deploys are frequent and
  // IndexNow re-crawls on its own schedule anyway. Content/page changes are
  // what we care about for instant indexing.
  return [...hits];
}

async function pingIndexNow(urls) {
  if (urls.length === 0) {
    console.log('[indexnow] no urls to submit — skipping.');
    return;
  }
  const { key, keyLocation } = loadKey();
  const body = { host: HOST, key, keyLocation, urlList: urls };
  console.log(`[indexnow] submitting ${urls.length} url(s):`);
  for (const u of urls) console.log(`  ${u}`);
  if (DRY) {
    console.log('[indexnow] --dry set, not posting.');
    return;
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    // 200 OK or 202 Accepted are both success. Never throw into a deploy.
    console.log(`[indexnow] endpoint responded ${res.status} ${res.statusText}`);
  } catch (err) {
    console.warn(`[indexnow] submit failed (swallowed): ${err.message}`);
  }
}

const mode = args.find((a) => a === '--all' || a === '--changed') || '--changed';
let urls;
if (mode === '--all') {
  urls = sitemapUrls();
} else {
  const positional = args.filter((a) => !a.startsWith('--'));
  urls = changedUrls(positional[0], positional[1]);
}
await pingIndexNow(urls);
