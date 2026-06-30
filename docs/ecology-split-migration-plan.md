# Ecology Arm — Split & Migration Plan

**Status:** Draft for review — no files moved yet.
**Goal:** Move the ecology/automation business off `oakfox.co.uk` onto its own property (`NEWSITE`) for ICP + SEO entity clarity, while keeping all sustainable-design and green-hosting content on OakFox (the studio's moat). Preserve existing rankings via 301 redirects.

---

## 1. What moves vs. what stays

### MOVES to `NEWSITE`
**Service pages (3):**
- `src/pages/services/environmental/index.astro`
- `src/pages/services/environmental/consultancy.astro`
- `src/pages/services/environmental/automation.astro`

**Blog posts — category "Ecology" (4):**
- `what-a-pea-actually-contains.mdx`
- `cost-of-a-preliminary-ecological-appraisal.mdx`
- `biodiversity-net-gain-small-sites-guide.mdx`
- `bng-is-burying-ecological-consultancies.mdx`

These 4 are the highest-intent, lowest-competition organic assets on the site (PEA/BNG queries). They are the new site's authority seed — but also the riskiest to move. **Do not move them until `NEWSITE` is live and ready to receive 301s.**

### STAYS on `oakfox.co.uk` (this is the moat — do NOT move)
- Branding, web design, development, copywriting, marketing, **green web hosting**
- Sustainability-angle blog posts: `what-makes-a-brand-sustainable`, `sustainability-claims-without-greenwashing`, `rebranding-without-greenwashing`, `future-of-sustainability-in-branding`, `sustainable-web-design-practical-guide`
- The original woodland/biodiversity *research* framing on `/about` (it underwrites the studio's "we can prove it" positioning)
- One slim **"Environmental & sustainability consultancy"** positioning page that links out to `NEWSITE` (preserves "we live our values" credibility for design clients without diluting the studio's topic focus)

---

## 2. Sequencing (do in this order — never orphan ranking content)

**Phase 0 — Stand up NEWSITE (no OakFox changes yet)**
1. Register domain, point DNS, set up hosting (likely same OakFox green-hosting reseller stack).
2. Scaffold the new site. Two viable homes:
   - **(a) Fold into the existing `oakfox-reports` Next.js/Supabase repo** as marketing pages — best if the product app and marketing should share a codebase/domain.
   - **(b) New Astro site** (copy this repo's BaseLayout/components) — best if you want the same fast static studio aesthetic and the product app lives elsewhere.
3. Recreate the 3 service pages + 4 ecology posts on NEWSITE with **new canonical URLs**. Build the tight PEA/BNG/SFI topic cluster there (internal links between the 4 posts + service pages).
4. Give NEWSITE its own `Organization` + `Service` schema, its own `llms.txt`, its own sitemap/robots. This is the entity-clarity win.

**Phase 1 — Cut over (one deploy each side)**
5. On NEWSITE: confirm all moved URLs resolve, schema validates, sitemap submitted to GSC/Bing.
6. On `oakfox.co.uk`: delete the 3 env pages + 4 ecology posts, add the single positioning page, add 301 redirects (Section 3), update internal references (Section 4).
7. Deploy both. Submit both sitemaps. Request indexing for the new URLs.

**Phase 2 — Settle (2–6 weeks)**
8. Watch GSC Coverage + the 4 ecology queries on both properties. Rankings will dip then recover on NEWSITE as redirects + re-indexing settle. Keep the 301s permanently.

---

## 3. 301 redirect map (cPanel `.htaccess`)

Append to `public/.htaccess` (the site already uses `RedirectMatch 301` — same pattern). Replace `NEWSITE` with the real domain.

```apache
# --- Ecology arm moved to NEWSITE (keep permanently) ---
RedirectMatch 301 ^/services/environmental/automation/?$        https://NEWSITE/automation/
RedirectMatch 301 ^/services/environmental/consultancy/?$       https://NEWSITE/consultancy/
RedirectMatch 301 ^/blog/what-a-pea-actually-contains/?$        https://NEWSITE/blog/what-a-pea-actually-contains/
RedirectMatch 301 ^/blog/cost-of-a-preliminary-ecological-appraisal/?$  https://NEWSITE/blog/cost-of-a-preliminary-ecological-appraisal/
RedirectMatch 301 ^/blog/biodiversity-net-gain-small-sites-guide/?$     https://NEWSITE/blog/biodiversity-net-gain-small-sites-guide/
RedirectMatch 301 ^/blog/bng-is-burying-ecological-consultancies/?$     https://NEWSITE/blog/bng-is-burying-ecological-consultancies/
```

**Note on `/services/environmental/` (index):** do NOT 301 this one to NEWSITE — repurpose it as the slim positioning/bridge page that stays on OakFox and links out. (Or 301 it too and put the bridge link in the nav/footer — your call. Recommended: keep a real page.)

Match the URL shapes to whatever NEWSITE actually uses; the left side above is fixed by OakFox's current URLs.

---

## 3b. Ranking protection — cross-domain canonical (interim), then 301 (cutover)

The risk during the overlap window (EcoScribe live, OakFox not yet cut over) is **duplicate content**: the 4 ecology posts exist on both domains, so Google could split or suppress OakFox's existing rankings.

**Implemented now (in the EcoScribe repo):** each migrated post carries `canonical: "https://oakfox.co.uk/blog/<slug>"` in its frontmatter (`content.config.ts` → `BaseLayout` `canonical` prop). So while both copies are live, EcoScribe's posts point Google at the OakFox originals — OakFox keeps its rankings and the copies aren't treated as competitors. Non-migrated EcoScribe pages self-canonical normally. Verified in the build: `dist/blog/*/index.html` → `rel=canonical` = oakfox.co.uk.

**At cutover (do these together, same deploy window):**
1. EcoScribe: **remove** the `canonical:` line from the 4 posts (they now self-canonical to ecoscribe.co.uk). Rebuild + redeploy.
2. OakFox: delete the 4 posts + 3 env pages and **add the 301s** from §3.
3. Submit both sitemaps to GSC/Bing; request (re)indexing of the new EcoScribe URLs.

This sequence means OakFox holds its rankings right up to cutover, then the 301s transfer the equity — no window where the content is duplicated *and* unprotected, and no window where it 404s.

Realistic expectation: a 2–4 week dip on these queries during re-indexing, then recovery on ecoscribe.co.uk. The 2 future-dated posts (cost-of-PEA, BNG-small-sites) aren't live on either domain yet, so they carry no ranking to lose.

## 4. OakFox cleanup checklist (Phase 1, step 6)

These reference the ecology arm and must be reworded, not just deleted:

- **Location pages** — `src/pages/locations/[slug].astro`:
  - line ~25: the `Environmental` service entry (`sustainability consultant ${location.name}`) — remove or repoint to the bridge page
  - lines ~33, 57, 59, 75: meta description, `serviceType`, page description, and FAQ answer all list "environmental consultancy" — reword to the studio's actual remaining services (branding, web, dev, marketing, copy, green hosting)
- **Homepage** `index.astro` — `services[]` array has an `Environmental` entry → replace or repoint
- **Services index** `services/index.astro` — "two dedicated practices (Branding, Environmental)" framing → becomes one practice, or reframe around the bridge page
- **`BaseLayout.astro`** — Organization `knowsAbout` lists "Environmental consultancy" + "Supply chain sustainability" → trim to studio scope (keep "Sustainable brand identity" etc.)
- **`llms.txt`** — remove ecology services from the OakFox summary; they belong in NEWSITE's llms.txt
- **`/about`** — keep the *research* credibility, but soften any claim that positions OakFox itself as an ecology-consultancy vendor; point ecology enquiries to NEWSITE
- **Footer / nav** — any "Environmental" links → bridge page or NEWSITE
- **Contact form** — the new `Environmental` pill (just added in Batch 4) → either keep as "I'm looking for ecology/reports support" routing them to NEWSITE, or remove. Update `contact.php` `$allowed` to match.
- **Redirect the `?service=environmental` / `consultancy` deep links** accordingly.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Lose PEA/BNG rankings during transition | Move posts ONLY after NEWSITE is live; 301 every URL; keep redirects permanently; request re-indexing |
| Duplicate content (post lives on both sites briefly) | Never run both simultaneously — delete-from-OakFox and publish-on-NEWSITE in the same cutover; or `rel=canonical` to NEWSITE if any overlap window |
| New domain has zero authority | Internal-link the 4 posts into a tight cluster; carry over the OakFox→ecology internal links as redirects; pursue a few sector backlinks |
| Location pages still imply ecology service | Section 4 cleanup is mandatory in the same deploy, or you advertise a service you no longer sell there |
| `contact.php` / build drift | Both deploy together (same gotcha as Batch 4) |

---

## 6. Decision still needed from Nathan

1. **Domain** (purchasing now).
2. **Codebase home:** fold into `oakfox-reports` (Next.js) **or** new Astro site? Drives how the 3 pages + 4 posts get rebuilt.
3. **`/services/environmental/` index:** keep as a real bridge page on OakFox (recommended) or 301 it away entirely?
4. **Timing:** when NEWSITE is ready, I execute Phase 1 (the OakFox-side cleanup + redirects) as its own batch.
