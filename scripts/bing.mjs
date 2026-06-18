#!/usr/bin/env node
// Bing Webmaster Tools reporter for oakfox.co.uk.
//
// Note: Bing's URL submission is powered by IndexNow under the hood, so
// scripts/indexnow.mjs already handles submission for Bing. This script's value
// is READING stats (traffic, queries, crawl, quota) that IndexNow can't give.
//
// Auth: an API key from Bing Webmaster Tools > Settings > API access. Put it in
// .env.local as BING_API_KEY=... (gitignored). Verification of the property is
// manual and must happen first — see --help.
//
// Usage:
//   node scripts/bing.mjs                 # sites, quota, traffic, queries
//   node scripts/bing.mjs --submit-urls   # WRITE: SubmitUrlbatch of live urls
//   node scripts/bing.mjs --help          # setup checklist

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'oakfox.co.uk';
const ORIGIN = `https://${SITE}`;
const API = 'https://ssl.bing.com/webmaster/api.svc/json';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);

if (flag('--help')) {
  console.log(`
Bing Webmaster Tools setup (one-time, manual — chicken-and-egg, can't automate):

  1. Add the property at https://www.bing.com/webmasters
     (Tip: "Import from Google Search Console" copies verification + sitemaps.)
  2. If verifying by XML file: Bing gives you a BingSiteAuth.xml — paste its
     contents to the agent; it'll save to public/BingSiteAuth.xml, you deploy,
     confirm it returns 200, then click Verify.
  3. Settings > API access > generate an API Key.
  4. Put it in .env.local:  BING_API_KEY=xxxxxxxx
  5. Run: node scripts/bing.mjs
`);
  process.exit(0);
}

function loadEnvLocal() {
  if (!existsSync('.env.local')) return;
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

function apiKey() {
  loadEnvLocal();
  const key = process.env.BING_API_KEY;
  if (!key) {
    console.error('No BING_API_KEY. Add it to .env.local — run --help for the checklist.');
    process.exit(1);
  }
  return key;
}

function liveUrls() {
  const idx = join('dist', 'sitemap-index.xml');
  if (!existsSync(idx)) return [ORIGIN + '/'];
  const index = readFileSync(idx, 'utf8');
  const children = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = new Set();
  for (const c of children) {
    const file = join('dist', c.split('/').pop());
    if (existsSync(file)) {
      for (const m of readFileSync(file, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1]);
    }
  }
  return [...urls];
}

async function get(method, key, extra = '') {
  const url = `${API}/${method}?apikey=${key}${extra}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} -> ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${method}: non-JSON response: ${text.slice(0, 200)}`);
  }
}

async function post(method, key, body) {
  const res = await fetch(`${API}/${method}?apikey=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} -> ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  return text;
}

async function report() {
  const key = apiKey();

  console.log('=== Sites ===');
  let siteUrl = `${ORIGIN}/`;
  try {
    const sites = await get('GetUserSites', key);
    const entries = sites.d || [];
    for (const s of entries) console.log(`  ${s.Url}`);
    const match = entries.find((s) => (s.Url || '').includes(SITE));
    if (match) siteUrl = match.Url;
    console.log(`  Using: ${siteUrl}`);
  } catch (e) {
    console.log(`  GetUserSites failed: ${e.message}`);
  }

  const q = `&siteUrl=${encodeURIComponent(siteUrl)}`;

  console.log('\n=== URL submission quota ===');
  try {
    const quota = await get('GetUrlSubmissionQuota', key, q);
    const d = quota.d || {};
    console.log(`  daily=${d.DailyQuota} monthly=${d.MonthlyQuota}`);
  } catch (e) {
    console.log(`  failed: ${e.message}`);
  }

  console.log('\n=== Rank & traffic ===');
  try {
    const stats = await get('GetRankAndTrafficStats', key, q);
    const rows = stats.d || [];
    let clicks = 0;
    let impr = 0;
    for (const r of rows) {
      clicks += r.Clicks || 0;
      impr += r.Impressions || 0;
    }
    console.log(`  ${rows.length} day(s) of data — clicks=${clicks} impressions=${impr}`);
  } catch (e) {
    console.log(`  failed: ${e.message}`);
  }

  console.log('\n=== Top queries ===');
  try {
    const stats = await get('GetQueryStats', key, q);
    const rows = (stats.d || []).slice(0, 10);
    for (const r of rows) console.log(`  "${r.Query}"  clicks=${r.Clicks} impr=${r.Impressions} pos=${r.AvgImpressionPosition}`);
    if (!rows.length) console.log('  (no query data yet)');
  } catch (e) {
    console.log(`  failed: ${e.message}`);
  }
}

async function submitUrls() {
  const key = apiKey();
  const siteUrl = `${ORIGIN}/`;
  const urlList = liveUrls();
  console.log(`Submitting ${urlList.length} urls via SubmitUrlbatch (note: IndexNow already covers this)...`);
  const out = await post('SubmitUrlbatch', key, { siteUrl, urlList });
  console.log(`Done: ${out.slice(0, 200)}`);
}

if (flag('--submit-urls')) {
  await submitUrls();
} else {
  await report();
}
