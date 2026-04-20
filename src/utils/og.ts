import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

// Load fonts from @fontsource packages at build time. Satori supports woff
// (not woff2), so the .woff files are the right choice.
const nodeModules = path.join(process.cwd(), 'node_modules');
const workSans400 = fs.readFileSync(
  path.join(nodeModules, '@fontsource/work-sans/files/work-sans-latin-400-normal.woff')
);
const workSans500 = fs.readFileSync(
  path.join(nodeModules, '@fontsource/work-sans/files/work-sans-latin-500-normal.woff')
);
const workSans600 = fs.readFileSync(
  path.join(nodeModules, '@fontsource/work-sans/files/work-sans-latin-600-normal.woff')
);
const workSans700 = fs.readFileSync(
  path.join(nodeModules, '@fontsource/work-sans/files/work-sans-latin-700-normal.woff')
);
const playfairItalic = fs.readFileSync(
  path.join(nodeModules, '@fontsource/playfair-display/files/playfair-display-latin-500-italic.woff')
);

export interface OgImageProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

const CREAM = '#F5F0E8';
const INK = '#1F2319';
const FOREST = '#1A5C12';
const STONE = '#D6D1C8';

function tpl({ eyebrow, title, subtitle, badge }: OgImageProps) {
  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        background: CREAM,
        display: 'flex',
        flexDirection: 'column',
        padding: '72px 80px',
        position: 'relative',
        fontFamily: 'Work Sans',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '-200px',
              left: '-120px',
              width: '700px',
              height: '700px',
              borderRadius: '50%',
              background: 'rgba(26, 92, 18, 0.10)',
              filter: 'blur(60px)',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '-0.5px',
                    color: INK,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  },
                  children: [
                    { type: 'span', props: { style: { color: FOREST }, children: '◆' } },
                    'OakFox',
                  ],
                },
              },
              badge
                ? {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '14px',
                        fontWeight: 500,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        color: FOREST,
                        border: `1px solid ${FOREST}`,
                        borderRadius: '999px',
                        padding: '8px 18px',
                      },
                      children: badge,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        {
          type: 'div',
          props: {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              paddingTop: '40px',
            },
            children: [
              eyebrow
                ? {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '15px',
                        fontWeight: 500,
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        color: FOREST,
                        marginBottom: '28px',
                      },
                      children: eyebrow,
                    },
                  }
                : null,
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: title.length > 80 ? '54px' : title.length > 50 ? '64px' : '76px',
                    fontWeight: 600,
                    letterSpacing: '-1.5px',
                    color: INK,
                    lineHeight: 1.05,
                    maxWidth: '1000px',
                  },
                  children: title,
                },
              },
              subtitle
                ? {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '22px',
                        color: 'rgba(31, 35, 25, 0.65)',
                        marginTop: '28px',
                        maxWidth: '900px',
                        lineHeight: 1.4,
                      },
                      children: subtitle,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `1px solid ${STONE}`,
              paddingTop: '28px',
              position: 'relative',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '16px',
                    color: 'rgba(31, 35, 25, 0.55)',
                  },
                  children: 'Sustainable design studio · West Lancashire, UK',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '16px',
                    fontWeight: 500,
                    color: FOREST,
                  },
                  children: 'oakfox.co.uk',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export async function renderOgPng(props: OgImageProps): Promise<Buffer> {
  const svg = await satori(tpl(props) as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Work Sans', data: workSans400, weight: 400, style: 'normal' },
      { name: 'Work Sans', data: workSans500, weight: 500, style: 'normal' },
      { name: 'Work Sans', data: workSans600, weight: 600, style: 'normal' },
      { name: 'Work Sans', data: workSans700, weight: 700, style: 'normal' },
      { name: 'Playfair Display', data: playfairItalic, weight: 500, style: 'italic' },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  return resvg.render().asPng();
}
