#!/usr/bin/env node
// Google Search Console reporter for oakfox.co.uk.
//
// Auth: a Google service-account key (OakFox has no Firebase, so this is a
// dedicated key you create — see the manual steps printed by --help). Provide
// it either as GOOGLE_SERVICE_ACCOUNT_KEY in .env.local (raw JSON, base64, or
// base64-with-real-newlines) OR as a file path in GSC_KEY_FILE.
//
// Usage:
//   node scripts/gsc.mjs                 # report: properties, sitemaps, perf, index status
//   node scripts/gsc.mjs --days 90       # change the performance window (default 28)
//   node scripts/gsc.mjs --inspect-all   # inspect EVERY live url (slow, quota-heavy)
//   node scripts/gsc.mjs --submit        # WRITE: submit sitemap-index.xml to GSC
//   node scripts/gsc.mjs --help          # setup checklist

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { google } from 'googleapis';

const SITE = 'oakfox.co.uk';
const ORIGIN = `https://${SITE}`;
const SITEMAP = `${ORIGIN}/sitemap-index.xml`;

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

if (flag('--help')) {
  console.log(`
GSC setup checklist (one-time, manual):

  1. Create / pick a Google Cloud project at https://console.cloud.google.com
  2. Enable the "Google Search Console API" on THAT project:
       https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
     (Watch out: enabling it on the wrong project is the #1 cause of
      "API not enabled" errors. Confirm the project NAME in the top bar.)
  3. Create a service account (IAM & Admin > Service Accounts), add a JSON key,
     download it. Save it next to the repo as gsc-service-account.json
     (gitignored) OR paste its base64 into .env.local as
     GOOGLE_SERVICE_ACCOUNT_KEY=...
  4. In Search Console (https://search.google.com/search-console) open the
     ${ORIGIN} property > Settings > Users and permissions > Add user.
     Add the service account's client_email.
       - "Restricted" is enough for performance + sitemaps.
       - "Owner" is required for per-URL index inspection (--inspect).
  5. Run: node scripts/gsc.mjs
`);
  process.exit(0);
}

// ---- minimal .env.local loader (no dotenv dependency)
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

// ---- resolve the service-account credentials, tolerating several encodings
function loadCredentials() {
  // 1. explicit key file
  const filePath =
    process.env.GSC_KEY_FILE ||
    readdirSync('.').find((f) => /^gsc-service-account.*\.json$/.test(f));
  if (filePath && existsSync(filePath)) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  }
  // 2. env var: raw JSON, base64, or base64 that decodes to JSON with real \n
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    const tryParse = (s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    };
    let creds = tryParse(raw);
    if (!creds) creds = tryParse(Buffer.from(raw, 'base64').toString('utf8'));
    if (creds) {
      // private_key sometimes arrives with escaped newlines
      if (creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
      return creds;
    }
  }
  console.error(
    'No credentials found. Set GOOGLE_SERVICE_ACCOUNT_KEY in .env.local or place\n' +
      'gsc-service-account.json in the repo root. Run --help for the full checklist.',
  );
  process.exit(1);
}

function authClient(readWrite) {
  loadEnvLocal();
  const creds = loadCredentials();
  const scope = readWrite
    ? 'https://www.googleapis.com/auth/webmasters'
    : 'https://www.googleapis.com/auth/webmasters.readonly';
  const jwt = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [scope],
  });
  return { jwt, clientEmail: creds.client_email };
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

// the handful worth checking index status on without burning quota
function keyUrls() {
  const all = liveUrls();
  const keep = (u) =>
    u === ORIGIN + '/' ||
    /\/services\/?$/.test(u) ||
    /\/blog\/?$/.test(u) ||
    (/\/blog\//.test(u) && !/\/tags\//.test(u)) ||
    /\/services\/[^/]+\/?$/.test(u);
  return all.filter(keep);
}

async function pickProperty(wm) {
  const { data } = await wm.sites.list();
  const sites = (data.siteEntry || []).map((s) => s.siteUrl);
  if (sites.length === 0) {
    console.error(
      `\nThe service account can see NO properties. Add its client_email as a\n` +
        `user on the ${ORIGIN} property in Search Console (see --help, step 4).`,
    );
    process.exit(1);
  }
  console.log('\nVisible properties:');
  for (const s of sites) console.log(`  ${s}`);
  const preferred =
    sites.find((s) => s === `sc-domain:${SITE}`) ||
    sites.find((s) => s === `${ORIGIN}/`) ||
    sites.find((s) => s.includes(SITE)) ||
    sites[0];
  console.log(`Using: ${preferred}`);
  return preferred;
}

async function reportSitemaps(wm, siteUrl) {
  console.log('\n=== Sitemaps ===');
  try {
    const { data } = await wm.sitemaps.list({ siteUrl });
    const maps = data.sitemap || [];
    if (!maps.length) {
      console.log('  (none submitted) — run with --submit to add sitemap-index.xml');
      return;
    }
    for (const m of maps) {
      const errs = m.errors || 0;
      const warns = m.warnings || 0;
      console.log(`  ${m.path}  submitted=${m.lastSubmitted?.slice(0, 10) || '?'}  errors=${errs} warnings=${warns}`);
    }
  } catch (e) {
    console.log(`  could not read sitemaps: ${e.message}`);
  }
}

async function reportPerformance(wm, siteUrl, days) {
  console.log(`\n=== Performance (last ${days} days) ===`);
  // GSC data lags ~3 days; window back from 3 days ago.
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const range = { startDate: fmt(start), endDate: fmt(end) };

  const query = async (dimensions) => {
    const { data } = await wm.searchanalytics.query({
      siteUrl,
      requestBody: { ...range, dimensions, rowLimit: 10 },
    });
    return data.rows || [];
  };

  try {
    const totals = await query([]);
    if (!totals.length) {
      console.log('  No data yet (new property / not enough traffic).');
      return;
    }
    const t = totals[0];
    console.log(
      `  clicks=${t.clicks}  impressions=${t.impressions}  ctr=${(t.ctr * 100).toFixed(1)}%  avgPos=${t.position.toFixed(1)}`,
    );
    const queries = await query(['query']);
    if (queries.length) {
      console.log('  Top queries:');
      for (const r of queries) console.log(`    "${r.keys[0]}"  clicks=${r.clicks} impr=${r.impressions} pos=${r.position.toFixed(1)}`);
    }
    const pages = await query(['page']);
    if (pages.length) {
      console.log('  Top pages:');
      for (const r of pages) console.log(`    ${r.keys[0]}  clicks=${r.clicks} impr=${r.impressions}`);
    }
  } catch (e) {
    console.log(`  could not read performance: ${e.message}`);
  }
}

async function reportIndexStatus(jwt, siteUrl, inspectAll) {
  const urls = inspectAll ? liveUrls() : keyUrls();
  console.log(`\n=== Index status (${urls.length} url${urls.length === 1 ? '' : 's'}) ===`);
  const inspector = google.searchconsole({ version: 'v1', auth: jwt });
  for (const url of urls) {
    try {
      const { data } = await inspector.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl },
      });
      const r = data.inspectionResult?.indexStatusResult || {};
      console.log(`  ${url}\n      verdict=${r.verdict || '?'} coverage="${r.coverageState || '?'}"`);
    } catch (e) {
      const msg = e.errors?.[0]?.message || e.message;
      console.log(`  ${url}\n      inspection failed: ${msg}`);
      if (/permission|Owner/i.test(msg)) {
        console.log('      (per-URL inspection requires the service account to be an OWNER in GSC)');
        break;
      }
    }
  }
}

async function submitSitemap() {
  const { jwt } = authClient(true);
  const wm = google.webmasters({ version: 'v3', auth: jwt });
  const siteUrl = await pickProperty(wm);
  console.log(`\nSubmitting ${SITEMAP} to ${siteUrl} ...`);
  await wm.sitemaps.submit({ siteUrl, feedpath: SITEMAP });
  console.log('Submitted. Re-listing:');
  await reportSitemaps(wm, siteUrl);
}

async function report() {
  const { jwt, clientEmail } = authClient(false);
  console.log(`Service account: ${clientEmail}`);
  const wm = google.webmasters({ version: 'v3', auth: jwt });
  const siteUrl = await pickProperty(wm);
  await reportSitemaps(wm, siteUrl);
  await reportPerformance(wm, siteUrl, parseInt(opt('--days', '28'), 10));
  await reportIndexStatus(jwt, siteUrl, flag('--inspect-all'));
}

if (flag('--submit')) {
  await submitSitemap();
} else {
  await report();
}
