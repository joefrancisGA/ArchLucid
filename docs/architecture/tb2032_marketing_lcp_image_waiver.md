# TB-2032 — Marketing LCP `next/image` waiver (evidence)

**Status:** Waived (2026-08-03) — no image-bound LCP candidate on marketing routes.  
**Pairs:** [`FIELD_WEB_VITALS_TRIAGE.md`](../runbooks/FIELD_WEB_VITALS_TRIAGE.md) (**TB-2031**), [`UI_LIGHTHOUSE_CI.md`](UI_LIGHTHOUSE_CI.md).

## Decision

Do **not** adopt `next/image` on marketing surfaces now. Acceptance for **TB-2032** allows a waiver when measurement / inventory shows LCP is **not** image-bound.

## Evidence (inventory)

| Surface | What paints first viewport | Raster hero? |
| --- | --- | --- |
| `/welcome` | Text hero + pricing/proof islands (`WelcomeMarketingPage`); brand via inline SVG (`ArchLucidLogo`) | No |
| `/see-it` | Text + `SeeItDeliverablePreview` (CSS/component stack, not a photo) | No |
| Showcase / live-demo | Demo payload UI; no full-bleed hero image | No |
| `public/marketing/why/` | SVG collateral (`evidence-callout.svg`) | No in-page raster hero |
| `public/marketing/screenshots/` | Optional local PNG collateral (may be gitignored); **not referenced** from marketing UI source | Not on LCP path |
| `public/logo/` | SVG wordmarks + generated OG/favicon rasters used for **metadata / PWA**, not in-page LCP | OG PNG is crawler/social, not first-paint LCP |

`archlucid-ui/src` has **no** `next/image` imports today. Brand chrome is inline SVG geometry, not `<img>` files. Screenshot PNGs under `public/marketing/screenshots/` do not appear in marketing TSX/TS sources.

## LCP implication

Expected marketing LCP element is **text / DOM chrome**, not a large decoded image. Forcing `next/image` would not move p75 LCP and risks CLS churn around sizes.

If field/lab LCP is poor on `/welcome`, triage to:

- **TB-2028** — `/welcome` First Load JS shell cut (JS-bound)
- **TB-2027** / proxy `Server-Timing` — TTFB / BFF wait
- Not image optimization

## Reopen criteria

Reopen **TB-2032** (or a successor) when **any** of:

1. Lighthouse / field LCP attribution shows a **raster** element as LCP on `/welcome`, `/see-it`, or showcase.
2. A full-bleed or large hero **PNG/JPEG/WebP/AVIF** is added under `public/marketing/` or linked from marketing first viewport.
3. Marketing source introduces `<img src="….(png|jpe?g|webp|avif)">` without `next/image` + explicit dimensions.

Regression guard: `archlucid-ui/src/lib/marketing-lcp-image-policy.test.ts`.

## Out of scope (unchanged)

- Operator shell images
- `next/font` (system stack already)
- Wholesale asset CDN redesign
- Brand OG PNG generation pipeline (`generate-brand-raster`)
