// Read-only GSC analysis for oakfox.co.uk: period-on-period totals, ranked
// queries/pages, striking-distance opportunities, CTR gaps, movers and
// cannibalisation. Uses the same service account as scripts/gsc.mjs.
//
//   node scripts/gsc-analyse.mjs            # 28d vs prior 28d
//   node scripts/gsc-analyse.mjs --days 90

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { google } from 'googleapis';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const DAYS = parseInt(opt('--days', '28'), 10);
const siteUrl = 'sc-domain:oakfox.co.uk';

const keyFile = process.env.GSC_KEY_FILE ||
  readdirSync('.').find((f) => /^gsc-service-account.*\.json$/.test(f));
if (!keyFile || !existsSync(keyFile)) { console.error('No service-account key found'); process.exit(1); }
const sa = JSON.parse(readFileSync(keyFile, 'utf8'));

const auth = new google.auth.JWT({
  email: sa.client_email, key: sa.private_key,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const sc = google.searchconsole({ version: 'v1', auth });

const ymd = (d) => d.toISOString().slice(0, 10);
// GSC data lags ~2 days
const end = new Date(); end.setDate(end.getDate() - 2);
const start = new Date(end); start.setDate(start.getDate() - (DAYS - 1));
const prevEnd = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1);
const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - (DAYS - 1));

const cur = { startDate: ymd(start), endDate: ymd(end) };
const prev = { startDate: ymd(prevStart), endDate: ymd(prevEnd) };

const q = async (range, body) =>
  (await sc.searchanalytics.query({ siteUrl, requestBody: { ...range, rowLimit: 25000, ...body } })).data.rows || [];

const sum = (rows) => rows.reduce((a, r) => ({
  clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions,
  wpos: a.wpos + r.position * r.impressions,
}), { clicks: 0, impressions: 0, wpos: 0 });

const pct = (a, b) => (b === 0 ? (a === 0 ? '0%' : 'new') : `${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(0)}%`);
const short = (u) => u.replace('https://oakfox.co.uk', '') || '/';

// Scrapers paste keyword-research CSV rows into Google verbatim
// ("green hosting,320,0.28,56,mid" = keyword,volume,cpc,position,difficulty).
// We match the keyword fragment, so they land in our report as huge
// zero-click impression spikes. Excluded from the real numbers.
const isCsvNoise = (q) => /,\s*\d/.test(q);

console.log(`\n=== OakFox GSC analysis ===`);
console.log(`Current : ${cur.startDate} -> ${cur.endDate} (${DAYS}d)`);
console.log(`Previous: ${prev.startDate} -> ${prev.endDate} (${DAYS}d)\n`);

// ---- 1. Totals, period on period
const [curDates, prevDates] = await Promise.all([q(cur, { dimensions: ['date'] }), q(prev, { dimensions: ['date'] })]);
const c = sum(curDates), p = sum(prevDates);
console.log('=== Totals (period on period) ===');
console.log(`  clicks       ${c.clicks} vs ${p.clicks}  (${pct(c.clicks, p.clicks)})`);
console.log(`  impressions  ${c.impressions} vs ${p.impressions}  (${pct(c.impressions, p.impressions)})`);
console.log(`  CTR          ${(c.impressions ? c.clicks / c.impressions * 100 : 0).toFixed(2)}% vs ${(p.impressions ? p.clicks / p.impressions * 100 : 0).toFixed(2)}%`);
const cAvg = c.impressions ? c.wpos / c.impressions : 0, pAvg = p.impressions ? p.wpos / p.impressions : 0;
console.log(`  avg position ${cAvg.toFixed(1)} vs ${pAvg.toFixed(1)}  (${cAvg < pAvg ? 'improved' : 'worse'} by ${Math.abs(cAvg - pAvg).toFixed(1)})`);

// ---- 2. Queries
const [curQ, prevQ] = await Promise.all([q(cur, { dimensions: ['query'] }), q(prev, { dimensions: ['query'] })]);
const prevQMap = new Map(prevQ.map((r) => [r.keys[0], r]));

const noise = curQ.filter((r) => isCsvNoise(r.keys[0]));
const curReal = curQ.filter((r) => !isCsvNoise(r.keys[0]));
const prevReal = prevQ.filter((r) => !isCsvNoise(r.keys[0]));
if (noise.length) {
  const n = sum(noise), cr = sum(curReal), pr = sum(prevReal);
  console.log(`\n=== CSV-noise queries excluded (scraper traffic) ===`);
  console.log(`  ${noise.length} queries, ${n.impressions} impressions (${(n.impressions / sum(curQ).impressions * 100).toFixed(0)}% of named-query impressions), ${n.clicks} clicks`);
  for (const r of [...noise].sort((a, b) => b.impressions - a.impressions).slice(0, 5)) {
    console.log(`     ${String(r.impressions).padStart(4)} impr  "${r.keys[0]}"`);
  }
  console.log(`  REAL named-query impressions ${pr.impressions} -> ${cr.impressions} (${pct(cr.impressions, pr.impressions)}), pos ${(pr.wpos / pr.impressions).toFixed(1)} -> ${(cr.wpos / cr.impressions).toFixed(1)}`);
}

const byImpr = [...curReal].sort((a, b) => b.impressions - a.impressions);

console.log(`\n=== Top 20 queries by impressions (${curReal.length} real queries) ===`);
console.log('  impr  clicks   ctr    pos   prev-pos  query');
for (const r of byImpr.slice(0, 20)) {
  const pr = prevQMap.get(r.keys[0]);
  console.log(`  ${String(r.impressions).padStart(5)} ${String(r.clicks).padStart(6)}  ${(r.ctr * 100).toFixed(1).padStart(5)}% ${r.position.toFixed(1).padStart(6)}   ${(pr ? pr.position.toFixed(1) : '-').padStart(7)}   ${r.keys[0]}`);
}

console.log(`\n=== STRIKING DISTANCE: pos 4-20, >=5 impressions (small push = page 1) ===`);
console.log('  impr  clicks    pos   prev-pos  query');
const strike = byImpr.filter((r) => r.position >= 4 && r.position <= 20 && r.impressions >= 5);
for (const r of strike.slice(0, 25)) {
  const pr = prevQMap.get(r.keys[0]);
  console.log(`  ${String(r.impressions).padStart(5)} ${String(r.clicks).padStart(6)} ${r.position.toFixed(1).padStart(6)}   ${(pr ? pr.position.toFixed(1) : 'new').padStart(7)}   ${r.keys[0]}`);
}
if (!strike.length) console.log('  (none)');

console.log(`\n=== HIGH DEMAND, WEAK RANK: >=25 impressions at pos >20 (authority/content lever) ===`);
console.log('  impr    pos   prev-pos  query');
for (const r of byImpr.filter((r) => r.position > 20 && r.impressions >= 25).slice(0, 20)) {
  const pr = prevQMap.get(r.keys[0]);
  console.log(`  ${String(r.impressions).padStart(5)} ${r.position.toFixed(1).padStart(6)}   ${(pr ? pr.position.toFixed(1) : 'new').padStart(7)}   ${r.keys[0]}`);
}

console.log(`\n=== CTR GAP: pos <=10, >=10 impressions, 0 clicks (title/meta problem) ===`);
const ctrGap = byImpr.filter((r) => r.position <= 10 && r.impressions >= 10 && r.clicks === 0);
for (const r of ctrGap.slice(0, 20)) console.log(`  impr=${String(r.impressions).padStart(4)} pos=${r.position.toFixed(1).padStart(5)}  ${r.keys[0]}`);
if (!ctrGap.length) console.log('  (none)');

// ---- 3. Pages
const [curP, prevP] = await Promise.all([q(cur, { dimensions: ['page'] }), q(prev, { dimensions: ['page'] })]);
const prevPMap = new Map(prevP.map((r) => [r.keys[0], r]));
console.log(`\n=== Top 15 pages by impressions ===`);
console.log('  impr  clicks   ctr    pos   prev-impr  page');
for (const r of [...curP].sort((a, b) => b.impressions - a.impressions).slice(0, 15)) {
  const pr = prevPMap.get(r.keys[0]);
  console.log(`  ${String(r.impressions).padStart(5)} ${String(r.clicks).padStart(6)}  ${(r.ctr * 100).toFixed(1).padStart(5)}% ${r.position.toFixed(1).padStart(6)}   ${String(pr ? pr.impressions : 0).padStart(8)}   ${short(r.keys[0])}`);
}

console.log(`\n=== Biggest page movers (impressions delta, min 20 impr either period) ===`);
const keys = new Set([...curP.map((r) => r.keys[0]), ...prevP.map((r) => r.keys[0])]);
const movers = [...keys].map((k) => {
  const a = curP.find((r) => r.keys[0] === k), b = prevPMap.get(k);
  return { k, now: a?.impressions || 0, was: b?.impressions || 0, pos: a?.position, wasPos: b?.position };
}).filter((m) => Math.max(m.now, m.was) >= 20).sort((a, b) => (b.now - b.was) - (a.now - a.was));
for (const m of movers.slice(0, 8)) console.log(`  UP    ${String(m.was).padStart(5)} -> ${String(m.now).padStart(5)}  (${pct(m.now, m.was).padStart(5)})  pos ${(m.wasPos?.toFixed(1) || '-').padStart(5)} -> ${(m.pos?.toFixed(1) || '-').padStart(5)}  ${short(m.k)}`);
for (const m of movers.slice(-6).reverse()) console.log(`  DOWN  ${String(m.was).padStart(5)} -> ${String(m.now).padStart(5)}  (${pct(m.now, m.was).padStart(5)})  pos ${(m.wasPos?.toFixed(1) || '-').padStart(5)} -> ${(m.pos?.toFixed(1) || '-').padStart(5)}  ${short(m.k)}`);

// ---- 4. Cannibalisation
const pairs = await q(cur, { dimensions: ['query', 'page'] });
const perQuery = new Map();
for (const r of pairs) {
  const k = r.keys[0];
  if (!perQuery.has(k)) perQuery.set(k, []);
  perQuery.get(k).push({ page: r.keys[1], impr: r.impressions, pos: r.position });
}
console.log(`\n=== Cannibalisation: queries where 2+ of our pages compete (top 10 by impressions) ===`);
const cann = [...perQuery.entries()].filter(([, v]) => v.length > 1)
  .map(([k, v]) => ({ k, v, impr: v.reduce((a, x) => a + x.impr, 0) })).sort((a, b) => b.impr - a.impr);
for (const { k, v, impr } of cann.slice(0, 10)) {
  console.log(`  "${k}" (${impr} impr across ${v.length} pages)`);
  for (const x of v.sort((a, b) => b.impr - a.impr)) console.log(`      impr=${String(x.impr).padStart(4)} pos=${x.pos.toFixed(1).padStart(5)}  ${short(x.page)}`);
}
if (!cann.length) console.log('  (none)');

// ---- 5. Device + country
for (const dim of ['device', 'country']) {
  const rows = (await q(cur, { dimensions: [dim] })).sort((a, b) => b.impressions - a.impressions).slice(0, 5);
  console.log(`\n=== By ${dim} ===`);
  for (const r of rows) console.log(`  ${r.keys[0].padEnd(10)} impr=${String(r.impressions).padStart(5)} clicks=${String(r.clicks).padStart(3)} ctr=${(r.ctr * 100).toFixed(2)}% pos=${r.position.toFixed(1)}`);
}
console.log('');
