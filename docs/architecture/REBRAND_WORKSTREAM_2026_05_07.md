> **Scope:** “Architecture Proof Engine” second-pass rebrand — execution tracker (category line + lead promise). Supersedes completion tracking for `REBRAND_WORKSTREAM_2026_04_23.md`.

# Architecture Proof Engine rebrand workstream (2026-05-07)

## Intent

- **Category (`BRAND_CATEGORY`):** Architecture Proof Engine  
- **Lead promise (homepage H1):** Defensible architecture, on demand.

Seam: [`archlucid-ui/src/lib/brand-category.ts`](../../archlucid-ui/src/lib/brand-category.ts) exports `BRAND_CATEGORY_LEGACY` (“AI Architecture Review Board”) and `BRAND_CATEGORY_LEGACY_ORIGINAL` (“AI Architecture Intelligence”) for SEO/metadata escape hatches.

CI guard: [`scripts/ci/assert_brand_category_seam.py`](../../scripts/ci/assert_brand_category_seam.py) — forbids hardcoding legacy phrases in scoped marketing/app/doc surfaces unless escape-marker identifiers appear (imports from seam).

## PR sequence (this session)

| PR | Surfaces | Status |
|----|----------|--------|
| **PR-1** | `brand-category.ts`, `WelcomeMarketingPage`, `BRAND_SYSTEM.md`, brand-category tests/e2e, `(marketing)/why/page.tsx` metadata comments | **Done** |
| **PR-2** | [`POSITIONING.md`](../go-to-market/POSITIONING.md), [`PRODUCT_DATASHEET.md`](../go-to-market/PRODUCT_DATASHEET.md), [`DEMO_QUICKSTART.md`](../go-to-market/DEMO_QUICKSTART.md), [`EXECUTIVE_ONE_EMAIL_KIT.md`](../go-to-market/EXECUTIVE_ONE_EMAIL_KIT.md) | **Done** |
| **PR-3** | [`EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md), [`COMPETITIVE_LANDSCAPE.md`](../go-to-market/COMPETITIVE_LANDSCAPE.md) | **Done** |
| **PR-4** | Per-vertical `templates/briefs/**/brief.md` | **N/A** (no legacy category literals present) |
| **PR-5** | `docs/trust-center.md`, `docs/library/PRODUCT_PACKAGING.md`, `dist/procurement-pack/*` | **N/A** (no legacy literals found in tracked procurement/trust snippets) |
| **PR-6** | Operator shell beyond marketing app routes | **N/A** (category flows via seam only; no stray literals under `src/app`) |
| **PR-7** | `--fail` on seam guard in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml); seam guard unit-test fixtures | **Done** |

## Verification

- `python scripts/ci/assert_brand_category_seam.py --fail`
- `python -m unittest discover -s scripts/ci/tests -p "test_assert_brand_category_seam.py"`
- `npm run rebrand-check` (from `archlucid-ui/` when available)
- Vitest: welcome + why marketing brand-category specs

## Related

- Superseded tracker (first rename wave): [`REBRAND_WORKSTREAM_2026_04_23.md`](REBRAND_WORKSTREAM_2026_04_23.md)
