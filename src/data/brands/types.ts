/**
 * Types for the client brand-guidelines microsites.
 *
 * One data file per client under `src/data/brands/`, registered in `index.ts`.
 * The page at `src/pages/brand/[slug]/index.astro` renders whatever sections
 * the file declares, in the order it declares them, so a client with no
 * photography direction simply omits that section and nothing breaks.
 *
 * ── Asset paths ──────────────────────────────────────────────────────────────
 * Every `src` in here MUST be relative (`./assets/logo.svg`), never absolute
 * (`/assets/logo.svg`). The built page is served from two places at once:
 * oakfox.co.uk/brand/<slug>/ and <slug>.oakfox.co.uk/ (a cPanel subdomain whose
 * document root is that folder). Absolute paths resolve to the wrong host on
 * the subdomain; relative ones work on both. Files live in
 * `public/brand/<slug>/assets/`.
 */

/** A single colour in the palette. Text colour on the swatch is calculated. */
export interface Swatch {
  name: string;
  hex: string;
  /** Print/spec values. Shown on the swatch only when supplied. */
  rgb?: string;
  cmyk?: string;
  pantone?: string;
  /** Where this colour is allowed to be used. */
  use?: string;
}

/** One stop in a gradient. `at` is its position along the sweep, 0 to 100. */
export interface GradientStop extends Swatch {
  at: number;
}

export interface SwatchGroup {
  label: string;
  note?: string;
  swatches?: Swatch[];
  /**
   * Renders one gradient bar with its stops marked, instead of flat chips.
   * Use it for a palette whose colours are only ever legal inside a gradient:
   * showing those as separate swatches invites exactly the misuse the rule
   * forbids. `angle` is any CSS gradient angle and defaults to `90deg`.
   */
  gradient?: { angle?: string; stops: GradientStop[] };
}

/** A foreground/background pair the template checks for WCAG contrast. */
export interface Pairing {
  label: string;
  fg: string;
  bg: string;
  note?: string;
}

export interface Typeface {
  name: string;
  /** "Display", "Body", "Accent": what this face is for. */
  role: string;
  /** The CSS stack used to render the specimen on this page. */
  stack: string;
  /** Set for an italic face: the specimen and any scale row using it slant. */
  italic?: boolean;
  weights?: string[];
  /** Where to buy/download it, and under what licence. */
  source?: string;
  /** Sample string for the big specimen. Defaults to the alphabet. */
  specimen?: string;
  note?: string;
}

export interface TypeScaleStep {
  label: string;
  /** As it should be specified: "48px / 3rem", "36pt". */
  size: string;
  lineHeight?: string;
  weight?: string;
  tracking?: string;
  /** Which typeface renders the sample. Matches a `Typeface.name`. */
  font?: string;
  sample: string;
}

export interface Lockup {
  src: string;
  alt: string;
  label: string;
  note?: string;
  /** Swatch behind the logo. 'light' | 'dark' | 'accent' | any CSS colour. */
  background?: 'light' | 'dark' | 'accent' | (string & {});
}

export interface Misuse {
  src?: string;
  label: string;
  note?: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  label?: string;
  note?: string;
}

export interface AssetFile {
  name: string;
  /** Relative path, e.g. './assets/downloads/logo-pack.zip'. */
  href: string;
  format?: string;
  size?: string;
  note?: string;
}

export interface RuleColumn {
  label: string;
  tone: 'do' | 'dont' | 'note';
  items: string[];
}

interface SectionBase {
  /** Anchor + nav target. Unique within the brand. */
  id: string;
  title: string;
  /** Short label for the side nav. Defaults to `title`. */
  nav?: string;
  intro?: string;
}

export type Section =
  /** Opening narrative: positioning statement, story blocks, values. */
  | (SectionBase & {
      type: 'story';
      statement?: string;
      blocks?: { label: string; body: string }[];
      values?: { name: string; body: string }[];
    })
  /** Logo lockups, clear space, minimum sizes, and what not to do. */
  | (SectionBase & {
      type: 'logo';
      lockups: Lockup[];
      clearspace?: { src?: string; alt?: string; note: string };
      minSize?: { note?: string; items: { label: string; value: string }[] };
      misuse?: Misuse[];
    })
  /** Colour palette, grouped, with optional contrast-checked pairings. */
  | (SectionBase & { type: 'colour'; groups: SwatchGroup[]; pairings?: Pairing[] })
  /** Typefaces, the type scale, and the rules for setting them. */
  | (SectionBase & {
      type: 'type';
      fonts: Typeface[];
      scale?: TypeScaleStep[];
      rules?: string[];
    })
  /** Tone of voice: principles, before/after examples, word list. */
  | (SectionBase & {
      type: 'voice';
      principles?: { name: string; body: string }[];
      examples?: { context: string; yes: string; no: string }[];
      lexicon?: { use?: string[]; avoid?: string[] };
    })
  /** Image grid. Use for photography direction, patterns, applications. */
  | (SectionBase & {
      type: 'gallery';
      items: GalleryItem[];
      columns?: 2 | 3 | 4;
      dos?: string[];
      donts?: string[];
    })
  /** Do / don't / note columns with no imagery. */
  | (SectionBase & { type: 'rules'; columns: RuleColumn[] })
  /** Download table. */
  | (SectionBase & { type: 'assets'; groups: { label: string; files: AssetFile[] }[] })
  /** Escape hatch for anything the section types above do not cover. */
  | (SectionBase & { type: 'custom'; html: string });

export interface Brand {
  /** URL slug and subdomain label. Lowercase, no spaces. */
  slug: string;
  name: string;
  /** One line under the name on the cover. */
  descriptor?: string;
  /** Full subdomain, for the cover and the footer. */
  subdomain?: string;
  /** Document version shown on the cover. Bump when you reissue. */
  version: string;
  /** ISO date (YYYY-MM-DD). Rendered as a long UK date. */
  updated: string;
  /** Palette for the page furniture itself, not the client's palette. */
  theme: {
    /** Client's primary. Drives links, rules, active nav, cover wash. */
    accent: string;
    /** Body text colour. */
    ink?: string;
    /** Page background. */
    paper?: string;
    /** Secondary text. */
    muted?: string;
    /** Cover background + foreground. Defaults to ink/paper. */
    cover?: { bg: string; fg: string };
  };
  /** Webfonts for this page. `href` is a stylesheet URL (Google Fonts etc). */
  fonts?: { href?: string; display?: string; body?: string; mono?: string };
  /** Client logo used in the header/cover. Relative paths. */
  logo: { light: string; dark?: string; favicon?: string };
  /**
   * Filename of a pre-generated PDF in `public/brand/<slug>/`, produced by
   * `npm run brand:pdf -- <slug>`. When set, the download button links
   * straight to it; when absent the button opens the browser print dialog.
   */
  pdf?: string;
  /** Who at OakFox to come back to. */
  contact?: { name: string; role?: string; email?: string; phone?: string; note?: string };
  sections: Section[];
}
