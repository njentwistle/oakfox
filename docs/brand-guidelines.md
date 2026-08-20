# Client brand-guidelines microsites

A data-driven template that turns one TypeScript file per client into a slick,
self-contained brand-guidelines page served from its own subdomain, for example
`magpiestale.oakfox.co.uk`, with a downloadable PDF of the same document.

The first client, The Magpie's Tale, is built in the repo with its real
identity. Its positioning copy is still a proposal and needs confirming with
the shop; everything about colour, type and logo use is settled. That client
also has a second page, a website concept, documented in `docs/magpiestale.md`.

---

## Adding a client

```bash
npm run brand:new -- magpiestale "The Magpie's Tale"
```

That scaffolds three things:

| Path | What it is |
| --- | --- |
| `src/data/brands/<slug>.ts` | The content. Everything the page renders. |
| `public/brand/<slug>/assets/` | Their logos, mockups, downloadable files. |
| `src/data/brands/index.ts` | The registry. The new client is appended for you. |

Then:

1. Drop the logo files into `public/brand/<slug>/assets/`.
2. Fill in `src/data/brands/<slug>.ts` top to bottom. It is ordered the way the
   client reads the page.
3. `npm run dev` → `http://localhost:4321/brand/<slug>/`
4. Create the subdomain in cPanel (below).

Delete any section you are not supplying. The page renders exactly what is in
`sections`, in the order given, and the side navigation follows.

---

## The section types

Each entry in `sections` needs `type`, `id` (the anchor) and `title`. `nav`
overrides the sidebar label; `intro` adds a standfirst. Full field lists are in
`src/data/brands/types.ts`.

| `type` | Renders |
| --- | --- |
| `story` | Positioning statement, labelled narrative blocks, value cards. |
| `logo` | Lockups on light/dark/accent stages, clear space, minimum sizes, misuse grid. |
| `colour` | Grouped swatches with RGB/CMYK/Pantone, plus contrast-checked pairings. |
| `type` | Typeface specimens, the type scale rendered at real sizes, setting rules. |
| `voice` | Principles, yes/no example pairs, a we-say / we-never-say word list. |
| `gallery` | Image grid at 2 to 4 columns, with optional do/don't lists. |
| `rules` | Do / don't / ask-first columns, no imagery. |
| `assets` | Download rows with format and size. |
| `custom` | Raw HTML. Uses the page CSS: `.grid`, `.g2`, `.g3`, `.rule-col`, `.value-card`. |

Two things are calculated rather than specified:

- **Swatch label colour.** Give a hex; the template picks black or white text by
  contrast, so a cream and a near-black both read.
- **Contrast pairings.** List the foreground and background; the template
  computes the WCAG ratio and the AA/AAA verdict. If a pairing fails, the badge
  says so, which is a useful thing to find out before the client does.

---

## Two hosts, one file

The build writes `dist/brand/<slug>/index.html`, and that folder answers on two
addresses at once:

- `oakfox.co.uk/brand/<slug>/` for how it builds and previews
- `<slug>.oakfox.co.uk/` for what the client is sent

The subdomain's document root *is* that folder, so `/` means something different
on each host. Two rules follow, and breaking either one produces a page that
looks perfect in preview and broken on the subdomain:

1. **Every asset path stays relative.** `./assets/logo.svg`, never
   `/assets/logo.svg`.
2. **No bundled CSS or JS on this page.** Astro emits those as absolute
   `/_astro/…` URLs. That is why the template uses `is:inline` styles and
   scripts, plain CSS instead of Tailwind, and does not use `BaseLayout`.

Webfonts come from Google Fonts over an absolute `https://` URL, which is
host-independent and therefore fine.

To check before deploying:

```bash
npm run build
grep -oE '(src|href)="/[^"]*"' dist/brand/<slug>/index.html
```

Any output at all is a path that will break on the subdomain.

---

## Setting up the subdomain in cPanel

Once the page is in a deploy, in cPanel → **Domains** → **Create A Domain**:

1. Domain: `<slug>.oakfox.co.uk`
2. Untick **Share document root**.
3. Document Root: `/home/oakfoxco/public_html/brand/<slug>`
4. Create. AutoSSL issues the certificate within the hour; until it does, the
   link works over `http://` only, so wait for the padlock before sending it.

The folder already exists after a deploy, so cPanel attaches to it rather than
creating an empty one. Nothing else needs configuring: `deploy.sh` copies the
whole build into `public_html`, which includes `brand/<slug>/`.

---

## The PDF

```bash
npm run build
npm run brand:pdf -- magpiestale
```

That writes `public/brand/<slug>/guidelines.pdf` and the next build copies it
into `dist/`. Set `pdf: 'guidelines.pdf'` in the client's data file and the
Download button links straight to the file; leave it unset and the button opens
the browser's own print dialogue instead, which produces the same document.

**Regenerate the PDF whenever the content changes.** The file is a snapshot,
and a client downloading a stale one is worse than no download at all.

The script drives the copy of Chrome already on the machine rather than pulling
in Playwright; set `CHROME_PATH` if yours is somewhere unusual. Run it online, or
the webfonts fall back and the PDF sets in the wrong typeface.

The print CSS is tuned for this: A4, one section per page, full-bleed cover and
colophon, no orphaned headings, and background colours forced on so the palette
prints as the palette.

---

## Privacy

These are client documents, not marketing pages. Three things keep them out of
search:

- `<meta name="robots" content="noindex, nofollow">` on the page itself
- `Disallow: /brand/` in `public/robots.txt`
- `!page.includes('/brand/')` in the sitemap filter in `astro.config.mjs`

They are not linked from anywhere on oakfox.co.uk. That is deliberate, so keep it
that way. If a client ever needs the page genuinely locked rather than merely
unlisted, add an `.htpasswd` to the subdomain folder in cPanel; note that
`deploy.sh` would overwrite it on every deploy unless it is backed up and
restored the way the dashboard's is.
