/**
 * Renders the carbon audit result as a PNG, for attaching to email.
 *
 * Two variants off one template, chosen by grade:
 *
 *   - B or better  -> "Certificate of Digital Carbon Rating". Something to be
 *                     pleased about, and the natural companion to the badge.
 *   - C or worse   -> "Website Carbon Audit Report", which itemises what is
 *                     actually wrong. You cannot hand someone a certificate for
 *                     a failing grade — it reads as sarcasm — but an itemised
 *                     report of real faults is the more persuasive document
 *                     anyway, because every line is a thing we could fix.
 *
 * PNG rather than PDF on purpose: Gmail and Outlook both preview an inline PNG
 * in the message body, where a PDF shows as an unopened paperclip. PDF
 * attachments also carry a measurable spam-score penalty on cold email.
 *
 * @typedef {import('./site-health.mjs').Fault} Fault
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { GRADE_COLORS, formatBytes, formatGrams } from './carbon.mjs';
import { STUDY, canDisplayBadge } from './site-health.mjs';

const WIDTH = 1200;
const HEIGHT = 848; // A4 landscape ratio — scales cleanly if anyone prints it

const CREAM = '#F5F0E8';
const INK = '#1F2319';
const FOREST = '#1A5C12';
const STONE = '#D6D1C8';
const MUTED = 'rgba(31, 35, 25, 0.62)';

const nodeModules = path.join(process.cwd(), 'node_modules');
const font = (file) => fs.readFileSync(path.join(nodeModules, '@fontsource', file));

let FONTS = null;
function fonts() {
  // Loaded lazily and cached: a batch run renders hundreds of these and there
  // is no reason to hit the disk more than once.
  if (!FONTS) {
    FONTS = [
      { name: 'Work Sans', data: font('work-sans/files/work-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
      { name: 'Work Sans', data: font('work-sans/files/work-sans-latin-500-normal.woff'), weight: 500, style: 'normal' },
      { name: 'Work Sans', data: font('work-sans/files/work-sans-latin-600-normal.woff'), weight: 600, style: 'normal' },
      { name: 'Work Sans', data: font('work-sans/files/work-sans-latin-700-normal.woff'), weight: 700, style: 'normal' },
      { name: 'Playfair Display', data: font('playfair-display/files/playfair-display-latin-500-italic.woff'), weight: 500, style: 'italic' },
    ];
  }
  return FONTS;
}

const text = (children, style) => ({ type: 'div', props: { style, children } });
const row = (children, style = {}) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children: children.filter(Boolean) },
});

function statBlock(label, value, accent = INK) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column', flex: 1 },
      children: [
        text(label, {
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '1.8px',
          textTransform: 'uppercase',
          color: MUTED,
          marginBottom: '10px',
        }),
        text(value, { fontSize: '30px', fontWeight: 600, color: accent, letterSpacing: '-0.5px' }),
      ],
    },
  };
}

/**
 * @param {{
 *   domain: string, grade: string, grams: number, bytes: number,
 *   requests?: number, greenHost?: boolean|null, cleanerThan?: number|null,
 *   faults?: Fault[], auditedAt?: string
 * }} data
 */
function template(data) {
  const faults = (data.faults || []).slice(0, 4);

  // The certificate variant needs a clean bill of health, not just a light
  // page — otherwise a 206 KB site from 1996 earns a "certificate" that then
  // lists four faults underneath it, which reads as a joke at our expense.
  const pass = canDisplayBadge(data.grade, {
    score: data.healthScore ?? 100,
    faults: data.faults || [],
  }).allowed;
  const gradeColor = GRADE_COLORS[data.grade] || INK;
  const mb = data.bytes / (1024 * 1024);
  const timesMedian = (data.bytes / 1024) / STUDY.medianKB;

  // One honest headline comparison. Good grades get the global percentile;
  // poor ones get the UK SME median from our own study, which is both fairer
  // and more useful to a small business than a worldwide figure.
  const comparison = pass
    ? data.cleanerThan
      ? `Lighter than approximately ${data.cleanerThan}% of pages tested worldwide.`
      : 'Lighter than the majority of pages tested worldwide.'
    : timesMedian >= 1.2
      ? `${timesMedian.toFixed(1)}× the median weight of the 100 UK small business websites we measured.`
      : `Around the median weight of the 100 UK small business websites we measured.`;

  return {
    type: 'div',
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        background: CREAM,
        display: 'flex',
        flexDirection: 'column',
        padding: '64px 72px',
        position: 'relative',
        fontFamily: 'Work Sans',
      },
      children: [
        // Ambient wash, matching the OG cards
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '-260px',
              right: '-160px',
              width: '760px',
              height: '760px',
              borderRadius: '50%',
              background: pass ? 'rgba(26, 92, 18, 0.10)' : 'rgba(178, 87, 20, 0.08)',
              filter: 'blur(70px)',
            },
          },
        },

        // ---- Header ----
        row(
          [
            row(
              [
                // Drawn rather than typed: Work Sans has no U+25C6 glyph, and
                // satori has no font fallback chain, so a literal ◆ renders as
                // a tofu box.
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '15px',
                      height: '15px',
                      background: FOREST,
                      transform: 'rotate(45deg)',
                      marginRight: '14px',
                    },
                  },
                },
                text('OakFox', { fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px', color: INK }),
              ],
              { alignItems: 'center' }
            ),
            text('oakfox.co.uk/website-carbon-audit', { fontSize: '15px', color: MUTED }),
          ],
          { alignItems: 'center', justifyContent: 'space-between', position: 'relative' }
        ),

        // ---- Title + grade ----
        row(
          [
            {
              type: 'div',
              props: {
                style: { display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '48px' },
                children: [
                  text(pass ? 'CERTIFICATE OF DIGITAL CARBON RATING' : 'WEBSITE CARBON AUDIT REPORT', {
                    fontSize: '14px',
                    fontWeight: 500,
                    letterSpacing: '3px',
                    color: FOREST,
                    marginBottom: '26px',
                  }),
                  text(data.domain, {
                    fontSize: data.domain.length > 30 ? '46px' : '58px',
                    fontWeight: 600,
                    color: INK,
                    letterSpacing: '-1.5px',
                    lineHeight: 1.05,
                  }),
                  text(comparison, {
                    fontSize: '19px',
                    color: MUTED,
                    marginTop: '22px',
                    lineHeight: 1.45,
                  }),
                ],
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  width: '210px',
                  height: '210px',
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: gradeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                children: text(data.grade, {
                  fontSize: data.grade.length > 1 ? '84px' : '104px',
                  fontWeight: 700,
                  color: CREAM,
                  letterSpacing: '-3px',
                }),
              },
            },
          ],
          { alignItems: 'center', marginTop: '58px', position: 'relative' }
        ),

        // ---- Stats ----
        row(
          [
            // "CO2e" not "CO₂e" — U+2082 is absent from Work Sans too.
            statBlock('CO2e per visit', formatGrams(data.grams), gradeColor),
            statBlock('Page weight', formatBytes(data.bytes)),
            data.requests ? statBlock('Requests', String(data.requests)) : null,
            statBlock(
              'Green hosting',
              data.greenHost === true ? 'Verified' : data.greenHost === false ? 'Not verified' : 'Unknown',
              data.greenHost === true ? FOREST : INK
            ),
          ],
          {
            marginTop: '54px',
            paddingTop: '34px',
            borderTop: `1px solid ${STONE}`,
            position: 'relative',
          }
        ),

        // ---- Faults, report variant only ----
        faults.length
          ? {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: '44px',
                  position: 'relative',
                },
                children: [
                  text('WHAT WE FOUND', {
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '2.4px',
                    color: MUTED,
                    marginBottom: '18px',
                  }),
                  ...faults.map((f) =>
                    row(
                      [
                        {
                          type: 'div',
                          props: {
                            style: {
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background:
                                f.severity === 'critical' ? '#8F1F1F' : f.severity === 'major' ? '#B25714' : STONE,
                              marginTop: '9px',
                              marginRight: '14px',
                              flexShrink: 0,
                            },
                          },
                        },
                        text(f.label, { fontSize: '19px', color: INK, lineHeight: 1.5 }),
                      ],
                      { alignItems: 'flex-start', marginBottom: '11px' }
                    )
                  ),
                ],
              },
            }
          : null,

        // ---- Footer ----
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              marginTop: 'auto',
              paddingTop: '30px',
              borderTop: `1px solid ${STONE}`,
              position: 'relative',
            },
            children: [
              text(
                `Measured ${data.auditedAt || ''} · Carbon estimated with co2.js and the Sustainable Web Design Model · Hosting checked against The Green Web Foundation directory.`,
                { fontSize: '13px', color: MUTED, lineHeight: 1.5 }
              ),
              text('Modelled estimates for comparison, not meter readings.', {
                fontSize: '13px',
                color: MUTED,
                marginTop: '5px',
              }),
            ],
          },
        },
      ].filter(Boolean),
    },
  };
}

/**
 * @param {Parameters<typeof template>[0]} data
 * @returns {Promise<Buffer>}
 */
export async function renderCertificatePng(data) {
  const svg = await satori(template(data), { width: WIDTH, height: HEIGHT, fonts: fonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
}

/**
 * Attachment filename. Deliberately neutral — "certificate" in the filename of
 * an F-grade report would undercut the whole email.
 * @param {string} domain
 * @returns {string}
 */
export function certificateFilename(domain) {
  return `oakfox-carbon-audit-${domain.replace(/[^a-z0-9.-]/gi, '-')}.png`;
}
