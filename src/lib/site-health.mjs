/**
 * Turns the raw signals from /api/carbon-audit.php into a health score and an
 * ordered list of concrete, nameable faults.
 *
 * Scoring lives here rather than in the crawler so the bands can be retuned
 * without a deploy, and so the outreach CLI and the public page can never
 * disagree about what counts as a problem.
 *
 * Every fault carries a `pitch`: one plain sentence, already interpolated with
 * this site's own numbers, written to drop straight into an email. That is the
 * whole point of this file — a score alone is not persuasive, "your footer
 * still says 2019" is.
 *
 * @typedef {'critical'|'major'|'minor'} Severity
 * @typedef {{ code: string, severity: Severity, label: string, pitch: string }} Fault
 */

/**
 * Benchmarks from our own 100-site UK SME study (July 2026), so any comparison
 * we make in an email is one we can show our working on.
 * Source: oakfox-carbon-study-2026-07-aggregates.json (n=99)
 */
export const STUDY = {
  medianKB: 1790,
  medianGrams: 0.238,
  medianRequests: 46,
  imageShareOfWeight: 0.605,
  gradeDOrWorse: 55,
  sampleSize: 99,
  gradedF: 35,
};

const WEIGHTS = { critical: 18, major: 10, minor: 3 };

const CURRENT_YEAR = 2026;

/** Site builders where "we can move you off it" is itself the angle. */
const LOCKED_IN_BUILDERS = ['wix', 'godaddy', 'weebly', 'duda'];

/**
 * @param {any} signals  the `signals` object from the crawler
 * @param {{ grade?: string, grams?: number, bytes?: number, requests?: number }} [carbon]
 * @returns {{ score: number, band: string, faults: Fault[], headline: Fault | null, builderLock: string | null }}
 */
export function scoreSite(signals, carbon = {}) {
  // No signals means we could not inspect the markup — a firewalled site
  // measured via the Lighthouse fallback, say. That is emphatically not the
  // same as a site with no problems, and it is not the same as a site with
  // every problem either. Absent evidence has to stay absent: scoring {} would
  // otherwise report "no meta description", "no H1", "no favicon" and a dozen
  // more faults about a page we never actually read.
  if (!signals || typeof signals !== 'object' || Object.keys(signals).length === 0) {
    return { score: null, band: 'unknown', faults: [], headline: null, builderLock: null, measured: false };
  }

  /** @type {Fault[]} */
  const faults = [];
  const s = signals;
  const add = (code, severity, label, pitch) => faults.push({ code, severity, label, pitch });

  const mb = carbon.bytes ? carbon.bytes / (1024 * 1024) : null;
  const legacy = s.legacyTags || {};
  const legacyTagTotal =
    (legacy.font || 0) + (legacy.center || 0) + (legacy.marquee || 0) + (legacy.blink || 0);

  // ---- Critical: things a visitor sees go wrong -------------------------
  if (s.viewport === false) {
    add(
      'no-viewport',
      'critical',
      'No mobile viewport',
      'the page has no mobile viewport set, so on a phone it loads the full desktop layout shrunk to fit and visitors have to pinch and zoom to read it'
    );
  }
  if (s.https === false) {
    add(
      'no-https',
      'critical',
      'No HTTPS',
      'the site still loads over plain HTTP, so Chrome and Safari mark it "Not secure" in the address bar before anyone reads a word of it'
    );
  }
  if (s.mixedContent > 0) {
    add(
      'mixed-content',
      'critical',
      `${s.mixedContent} insecure asset${s.mixedContent === 1 ? '' : 's'}`,
      `${s.mixedContent} file${s.mixedContent === 1 ? '' : 's'} on the page ${s.mixedContent === 1 ? 'is' : 'are'} still requested over plain HTTP, which modern browsers refuse to load — so something on the page is silently not appearing`
    );
  }
  if (s.flash > 0) {
    add(
      'flash',
      'critical',
      'Flash content',
      'there is still Flash content embedded in the page, and no browser has been able to play it since 2020'
    );
  }

  // ---- Major: clearly dated, cheap to name ------------------------------
  if (typeof s.copyrightYear === 'number' && s.copyrightYear <= CURRENT_YEAR - 2) {
    add(
      'stale-copyright',
      'major',
      `Copyright ${s.copyrightYear}`,
      `the footer still reads ${s.copyrightYear}, which tells every visitor how long it has been since anyone touched the site`
    );
  }
  if (s.layoutTables > 0 || legacyTagTotal > 0) {
    const bits = [];
    if (s.layoutTables > 0) bits.push('HTML tables for layout');
    if (legacy.font > 0) bits.push('<font> tags');
    if (legacy.center > 0) bits.push('<center> tags');
    if (legacy.marquee > 0) bits.push('a <marquee>');
    add(
      'legacy-markup',
      'major',
      'Pre-CSS markup',
      `the page is built with ${bits.join(' and ')} — techniques that went out of use around twenty years ago, which is usually a sign the site has been patched rather than rebuilt for a long time`
    );
  }
  if (s.jqueryVersion && /^1\./.test(s.jqueryVersion)) {
    add(
      'old-jquery',
      'major',
      `jQuery ${s.jqueryVersion}`,
      `it runs jQuery ${s.jqueryVersion}, a version with publicly known security issues that stopped getting fixes years ago`
    );
  }
  if (s.metaRefresh) {
    add(
      'meta-refresh',
      'major',
      'Meta refresh redirect',
      'the page redirects using a meta refresh tag, a 1990s technique that search engines treat as a bad signal'
    );
  }
  // Weight is a fault in its own right, not merely a headline figure. Scoring it
  // only above 2x the median left genuinely poor sites unpitched: a cleaning
  // firm measured at an F carbon grade came out with a health score of 88 and no
  // pitch at all, because its markup happened to be tidy. A page that costs its
  // owner mobile visitors is a problem whatever its HTML looks like.
  const times = mb !== null ? (mb * 1024) / STUDY.medianKB : null;
  if (carbon.grade && ['D', 'E', 'F'].includes(carbon.grade)) {
    const severity = carbon.grade === 'D' && !(times && times >= 3) ? 'minor' : 'major';
    const medianClause =
      times && times >= 1.2
        ? `, ${times.toFixed(1)}x the median of the 100 UK small business sites we measured,`
        : '';
    add(
      'poor-carbon-grade',
      severity,
      `Carbon grade ${carbon.grade}${mb !== null ? ` · ${mb.toFixed(1)} MB` : ''}`,
      mb !== null
        ? `the homepage weighs ${mb.toFixed(1)} MB${medianClause} which puts it at a ${carbon.grade} carbon rating — and more to the point means it is slow over mobile data, where most people will now be reading it`
        : `the page carries enough weight to earn a ${carbon.grade} carbon rating, which means slow loading over mobile data`
    );
  }
  if (s.imageCount > 0 && !s.modernImages && !s.srcset) {
    add(
      'unoptimised-images',
      'major',
      'No modern image formats',
      'none of the images are in WebP or AVIF and none have responsive sizes set, so phones download the same full-size files a desktop does — images are about 60% of the average site\'s weight, so this is usually the single biggest win available'
    );
  }

  // ---- Minor: real, but supporting evidence rather than the hook --------
  if (!s.metaDescription) {
    add('no-meta-description', 'minor', 'No meta description', 'the page has no meta description, so Google is writing its own snippet for your search listing');
  }
  if (!s.structuredData) {
    add('no-structured-data', 'minor', 'No structured data', 'there is no structured data, so the site cannot show ratings, opening hours or contact details directly in search results');
  }
  if (s.h1Count === 0) {
    add('no-h1', 'minor', 'No H1 heading', 'the page has no main heading in its code, which makes it harder for search engines to work out what it is about');
  }
  if (!s.html5Doctype) {
    add('old-doctype', 'minor', 'Pre-HTML5 doctype', 'the page still declares an old pre-HTML5 doctype, which puts some browsers into a backwards-compatibility rendering mode');
  }
  if (s.legacyAnalytics) {
    add('legacy-analytics', 'minor', 'Retired analytics', 'it still uses the retired Universal Analytics script, so the visitor numbers stopped being collected when Google switched it off');
  }
  if (!s.favicon) {
    add('no-favicon', 'minor', 'No favicon', 'there is no favicon, so the site shows a blank page icon in browser tabs and bookmarks');
  }
  if (!s.lang) {
    add('no-lang', 'minor', 'No language attribute', 'the page does not declare its language, which affects screen readers and translation');
  }
  if (s.renderBlockingScripts >= 3) {
    add(
      'render-blocking',
      'minor',
      `${s.renderBlockingScripts} blocking scripts`,
      `${s.renderBlockingScripts} scripts load in the page head without async or defer, so the browser has to stop and fetch each one before it can show anything`
    );
  }
  if (s.imageCount >= 8 && !s.lazyLoading) {
    add('no-lazy-loading', 'minor', 'No lazy loading', `all ${s.imageCount} images load immediately, including the ones far below the fold that most visitors never scroll to`);
  }
  if (s.titleLength === 0) {
    add('no-title', 'minor', 'No page title', 'the page has no title tag, so browsers and search results have nothing to label it with');
  } else if (s.titleLength > 65) {
    add('long-title', 'minor', `Title ${s.titleLength} chars`, `the page title runs to ${s.titleLength} characters, so Google truncates it in search results`);
  }

  const penalty = faults.reduce((sum, f) => sum + WEIGHTS[f.severity], 0);
  const score = Math.max(0, 100 - penalty);

  const builderLock = LOCKED_IN_BUILDERS.includes(s.cms) ? s.cms : null;

  const order = { critical: 0, major: 1, minor: 2 };
  faults.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    score,
    band: healthBand(score),
    faults,
    headline: faults[0] || null,
    builderLock,
    measured: true,
  };
}

/**
 * @param {number} score
 * @returns {string}
 */
export function healthBand(score) {
  if (score >= 85) return 'healthy';
  if (score >= 70) return 'minor-issues';
  if (score >= 50) return 'dated';
  if (score >= 30) return 'poor';
  return 'critical';
}

/**
 * Is this site worth pitching a rebuild to? Deliberately conservative: a site
 * with only cosmetic SEO nits does not need us, and emailing them anyway is
 * how a sender reputation gets burned.
 *
 * @param {{ score: number, faults: Fault[] }} health
 * @param {string} [carbonGrade]
 * @returns {boolean}
 */
export function isRebuildProspect(health, carbonGrade) {
  const hasSeriousFault = health.faults.some((f) => f.severity !== 'minor');
  const badCarbon = ['D', 'E', 'F'].includes(carbonGrade || '');
  return hasSeriousFault && (health.score < 70 || badCarbon);
}

/**
 * How strong a rebuild prospect this is, higher being better. Used to sort the
 * export so the best conversations are at the top of the list.
 *
 * Health score alone is not enough: a 22 MB homepage measured in the field came
 * out at health 90, because its markup was tidy and only the weight fault fired.
 * Weight and markup are different axes and a good prospect can be bad on either,
 * so both feed in — as does whether we have a role mailbox, since info@ gets
 * read and answered where a named individual's address often does not.
 *
 * @param {{ grade?: string, healthScore?: number|null, faults?: Fault[] }} audit
 * @param {{ emailType?: string|null }} [contact]
 * @returns {number}
 */
export function leadPriority(audit, contact = {}) {
  const CARBON_WEIGHT = { F: 25, E: 18, D: 12, C: 5 };
  const faults = audit.faults || [];

  let score = 0;
  score += typeof audit.healthScore === 'number' ? 100 - audit.healthScore : 0;
  score += CARBON_WEIGHT[audit.grade] || 0;
  score += faults.filter((f) => f.severity === 'critical').length * 20;
  score += faults.filter((f) => f.severity === 'major').length * 6;

  // Magnitude, not just the letter. The grade bands top out at F, so a 2.6 MB
  // page and a 22 MB page score identically on the letter alone — which ranked
  // a genuinely extraordinary find (22 MB, 12.6x the median, measured in the
  // field) last in its own batch. The size of the number is itself the opener.
  if (audit.bytes) {
    const timesMedian = audit.bytes / 1024 / STUDY.medianKB;
    if (timesMedian > 1) score += Math.min(35, (timesMedian - 1) * 4);
  }

  if (contact.emailType === 'role') score += 5;
  return Math.round(score);
}

/**
 * Whether a site may display the badge.
 *
 * A good carbon grade is necessary but not sufficient, which is not obvious
 * until you measure something like the 1996 Space Jam site: 206 KB, so a
 * genuine A+ on carbon, while having no mobile viewport, a copyright reading
 * 1996 and table-based layout. Light is not the same as good. Issuing an "A+"
 * badge to a site like that would make the badge worthless and would embarrass
 * us the first time anyone clicked through to the audit behind it.
 *
 * So: the carbon grade must be A+/A/B, there must be no critical fault, and
 * the site must not be failing by accumulation. Blockers come back named, so
 * the withheld case can be explained rather than silently hiding the panel.
 *
 * @param {string} carbonGrade
 * @param {{ score: number, faults: Fault[] }} health
 * @returns {{ allowed: boolean, blockers: Fault[] }}
 */
export function canDisplayBadge(carbonGrade, health) {
  if (!['A+', 'A', 'B'].includes(carbonGrade)) {
    return { allowed: false, blockers: [] };
  }
  // Unmeasured health cannot be certified. Withheld with no blockers, so the
  // caller shows nothing rather than accusing the site of faults we never saw.
  // (Guarded explicitly because `null < 50` is true in JavaScript.)
  if (typeof health.score !== 'number') {
    return { allowed: false, blockers: [] };
  }
  const critical = health.faults.filter((f) => f.severity === 'critical');
  if (critical.length) {
    return { allowed: false, blockers: critical };
  }
  if (health.score < 50) {
    return { allowed: false, blockers: health.faults.filter((f) => f.severity === 'major').slice(0, 3) };
  }
  return { allowed: true, blockers: [] };
}
