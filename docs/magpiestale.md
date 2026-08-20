# The Magpie's Tale

Independent bookshop, Churchtown, Southport. Two pages, one cPanel subdomain.

| URL | What it is | Source |
| --- | --- | --- |
| `magpiestale.oakfox.co.uk/` | Brand guidelines | `src/data/brands/magpiestale.ts` |
| `magpiestale.oakfox.co.uk/mockup/` | Website concept | `src/pages/brand/magpiestale/mockup.astro` |

Both also answer on `oakfox.co.uk/brand/magpiestale/` and `.../mockup/`, which is
how they build and preview. Every asset path in both is relative for that
reason; see the note at the top of `src/data/brands/types.ts`.

**cPanel:** point a `magpiestale` subdomain at
`public_html/brand/magpiestale/`. The mockup then follows for free, because it
is a folder inside that one.

---

## What the client supplied

One image: a pen drawing of the shopfront, with a magpie on the roof and a
magpie roundel on the fascia. Everything visual is derived from it or from the
brief that came with it (Garamond, black and white, a teal to purple shimmer
used sparingly).

## The identity in one line

> Everything is black and white, except the shimmer.

A magpie reads as black and white until light catches it, and then the tail
goes green, blue, violet and back to black. Ink and paper carry every piece,
and colour appears once, as a gradient, where the tail would be.

Three practical rules fall out of that, and they are the ones most likely to be
broken:

1. The shimmer is never used flat. One stop on its own is not a brand colour.
2. It always carries all three stops, with the blue at **68%**, not halfway.
   Interpolating teal to violet directly passes through `#344E7E`, a flat slate
   blue. 68% is where the blue sits in perceptual terms: teal to blue measures
   about 56 in Lab, blue to violet about 26, so an even-looking sweep needs the
   middle stop past centre.
3. One shimmer element per piece.

---

## Assets

`public/brand/magpiestale/assets/`. Rebuild the logo family with:

```bash
node scripts/magpiestale-assets.mjs
```

It reads `scripts/magpiestale-paths.json`, which holds two flattened outlines,
so the build needs neither Python nor potrace.

**Wordmark.** Typeset in EB Garamond at weight 500 with +12/1000 tracking, then
converted to outlines. 500 rather than 400 because the mark has to survive being
reversed out of black and printed at 34 mm. Because it is outlined it needs no
font installed, which matters when a signmaker opens it.

**Magpie.** Traced with potrace from the bird on the roof of the client's
drawing, not redrawn. The wobble is the point: it is the only thing in the
identity another bookshop could not commission. The roundel bird on the fascia
was the other candidate and lost because it is blurred at source resolution.

**Fonts.** EB Garamond, roman and italic, subset to the characters a UK
bookshop needs and served from `assets/fonts/`. 57 KB for the pair, with no
third-party request to declare in a privacy notice. Licence is OFL, so a
printer can install it without buying anything.

The subset deliberately keeps `smcp`, `c2sc`, `lnum` and `tnum`. An earlier
build dropped them and cost 41 KB, which broke the document's own rule about
lining figures: the guidelines asked for them and the shipped font could not
produce them. The extra 16 KB buys real small caps for labels and buttons, and
lining tabular figures for prices, hours, phone numbers and dates. Without
them, Garamond's default oldstyle figures make a string like `01704 000000`
noticeably harder to scan, which is the thing that usually prompts somebody to
ask for a sans.

One family throughout, including `fonts.mono`. Adding a sans for the interface
layer was considered and tested against three alternatives; the featured
Garamond subset came out at roughly the same weight as Garamond plus a sans,
so it was not a carbon decision. Revisit it if the site ever grows a real
transactional layer (filters, tables, a basket), where a sans would earn its
place.

---

## Illustration: two hands, kept apart

There are two illustration styles and they must not meet at the same size.

- **The shopfront** is the client's own drawing. Flat, wobbly, no perspective,
  no tonal shading. It goes large and alone.
- **The spot set** in `assets/spots/` is generated, and came out as polished
  Victorian wood engraving: fine cross-hatching, rendered form, cast shadows.
  Handsome, but visibly a different illustrator.

The rule in the guidelines is a size rule, because that is what actually works:
spots stay under 160 px on screen, where the hatching reads as texture rather
than as a competing hand. At similar sizes the two styles pull against each
other and the shopfront reads as the weaker of the two, when it is simply the
plainer one.

Spots are stored as 1-bit lossless WebP at 340 px, displayed at half that. The
1-bit conversion is worth knowing about: the same images as antialiased
greyscale are around 37 KB each, and as pure black and white they are 2 to 7 KB.
Six times lighter, and it also satisfies the palette rule, which allows no greys.

To regenerate the set in the client's own naive hand rather than the engraved
one, use the script in the MagpiesTale working folder with `--style naive`. The
first pass defaulted to engraving because words like "fineliner",
"cross-hatching" and "pen and ink" all steer these models straight to
scraperboard; the naive prompt has to name the skill level and rule the
engraving vocabulary out explicitly.

---

## Carbon

Verified with the repo's own `src/lib/carbon.mjs`, which wraps co2.js:

| Page | Transfer | g CO2e per visit, green host | Rating |
| --- | --- | --- | --- |
| Proposed homepage, first visit | ~116 KB | 0.0144 | A+ |
| Proposed homepage, cached | ~15 KB | 0.0019 | A+ |

The A+ band tops out at 0.04 g, which is about 323 KB on a green host. The
proposed homepage sits at just over a third of that, so the shop can add real
photography later without the rating moving.

---

## What still needs confirming

The positioning copy is a proposal: the story blocks, the values and the voice
examples in `magpiestale.ts`, and every word of content in the mockup. The
books in the mockup are real, the notes about them are written as examples of
the right tone, and the address, phone number and opening hours are stand-in.

Colour, type, logo use, the illustration rule and the checklist are settled and
do not need confirming.
