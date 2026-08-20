/**
 * Small colour helpers for the brand-guidelines template.
 *
 * These exist so a client data file only ever has to carry a hex value: the
 * swatch label colour, the AA/AAA verdicts on a pairing, and the tinted
 * section washes are all derived rather than hand-specified.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Accepts #rgb, #rrggbb, and the same without the hash. Returns null if unparseable. */
export function hexToRgb(hex: string): Rgb | null {
  const clean = hex.trim().replace(/^#/, '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** WCAG relative luminance. 0 = black, 1 = white. */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** WCAG contrast ratio between two hex colours, 1–21. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Which of two text colours to lay over `bg`. Used for swatch labels so a pale
 * cream and a near-black both read without the data file saying which.
 */
export function readableOn(bg: string, dark = '#141414', light = '#ffffff'): string {
  return contrast(bg, dark) >= contrast(bg, light) ? dark : light;
}

/** `#1a5c12` + 0.08 → `rgba(26, 92, 18, 0.08)`. Falls back to transparent. */
export function alpha(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'transparent';
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

/** AA/AAA verdict for a pairing, at both body and large-text thresholds. */
export function wcag(ratio: number): {
  ratio: string;
  body: 'AAA' | 'AA' | 'Fail';
  large: 'AAA' | 'AA' | 'Fail';
  pass: boolean;
} {
  const body = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail';
  const large = ratio >= 4.5 ? 'AAA' : ratio >= 3 ? 'AA' : 'Fail';
  return { ratio: ratio.toFixed(2), body, large, pass: ratio >= 4.5 };
}
