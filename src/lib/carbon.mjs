/**
 * Shared carbon grading — Sustainable Web Design model, via co2.js.
 *
 * Plain .mjs with JSDoc types rather than .ts on purpose: this module is
 * imported both by the browser bundle (src/pages/website-carbon-audit.astro,
 * compiled by Vite) and by bare `node` CLI scripts under scripts/leads/, and
 * local Node is a major version behind the repo's declared engine so there is
 * no type-stripping loader to rely on.
 *
 * @typedef {'A+'|'A'|'B'|'C'|'D'|'E'|'F'} Grade
 */

import { co2 } from '@tgwf/co2';

/**
 * Digital carbon rating bands in g CO2e per visit, matching co2.js perVisit
 * output. Used as a fallback — the letter grade normally comes from co2.js.
 * @type {Array<{ grade: Grade, max: number }>}
 */
export const SWD_BANDS = [
  { grade: 'A+', max: 0.04 },
  { grade: 'A', max: 0.079 },
  { grade: 'B', max: 0.145 },
  { grade: 'C', max: 0.209 },
  { grade: 'D', max: 0.278 },
  { grade: 'E', max: 0.359 },
  { grade: 'F', max: Infinity },
];

/**
 * Keyed loosely rather than by Grade: callers index it with the raw string
 * co2.js hands back, and narrowing that everywhere buys nothing.
 * @type {Record<string, string>}
 */
export const GRADE_COLORS = {
  'A+': '#1A5C12',
  A: '#2E6B1E',
  B: '#4F7A1F',
  C: '#B07D10',
  D: '#B25714',
  E: '#A63A1B',
  F: '#8F1F1F',
};

/**
 * Percentile anchors behind the SWD rating bands, for "cleaner than X%".
 * @type {Array<[number, number]>}
 */
export const CLEANER_ANCHORS = [
  [0, 99],
  [0.04, 95],
  [0.079, 90],
  [0.145, 80],
  [0.209, 70],
  [0.278, 60],
  [0.359, 50],
];

/** Grades that earn an embeddable badge. */
export const BADGE_GRADES = /** @type {Grade[]} */ (['A+', 'A', 'B']);

/** @type {any} */
let swdModel = null;

/**
 * @param {number} bytes
 * @param {boolean} greenHost
 * @returns {{ grams: number, rating: string | null }}
 */
export function estimateCarbon(bytes, greenHost) {
  if (!swdModel) {
    const options = {
      rating: true,
      dataReloadRatio: 0.02,
      firstVisitPercentage: 0.75,
      returnVisitPercentage: 0.25,
    };
    try {
      swdModel = new co2({ model: 'swd', version: 4, ...options });
    } catch {
      swdModel = new co2({ model: 'swd', ...options });
    }
  }
  /** @type {any} */
  const raw = swdModel.perVisit(bytes, greenHost);
  if (typeof raw === 'number') return { grams: raw, rating: null };
  return {
    grams: Number(raw?.total ?? raw?.co2 ?? 0),
    rating: typeof raw?.rating === 'string' ? raw.rating : null,
  };
}

/**
 * @param {number} grams
 * @returns {number | null} null below the median, which reads better as text
 */
export function cleanerThanFromGrams(grams) {
  if (grams > 0.359) return null;
  for (let i = 1; i < CLEANER_ANCHORS.length; i++) {
    const [g0, p0] = CLEANER_ANCHORS[i - 1];
    const [g1, p1] = CLEANER_ANCHORS[i];
    if (grams <= g1) {
      return Math.round(p0 + ((grams - g0) / (g1 - g0)) * (p1 - p0));
    }
  }
  return 50;
}

/**
 * @param {number} grams
 * @returns {Grade}
 */
export function gradeFromGrams(grams) {
  for (const band of SWD_BANDS) {
    if (grams <= band.max) return band.grade;
  }
  return 'F';
}

/**
 * @param {string} grade
 * @returns {boolean}
 */
export function isBadgeEligible(grade) {
  return BADGE_GRADES.includes(/** @type {Grade} */ (grade));
}

/**
 * URL-safe form of a grade, for badge filenames. 'A+' -> 'a-plus'.
 * @param {string} grade
 * @returns {string}
 */
export function badgeSlug(grade) {
  return grade.toLowerCase().replace('+', '-plus');
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * @param {number} grams
 * @returns {string}
 */
export function formatGrams(grams) {
  if (grams < 0.1) return `${grams.toFixed(3)} g`;
  return `${grams.toFixed(2)} g`;
}

/**
 * @param {string} raw
 * @returns {URL | null}
 */
export function normaliseUrl(raw) {
  let input = raw.trim();
  if (!input) return null;
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`;
  try {
    const url = new URL(input);
    if (!url.hostname.includes('.')) return null;
    return url;
  } catch {
    return null;
  }
}
