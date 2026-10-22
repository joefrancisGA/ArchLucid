/**
 * Brand-neutral content seam for the buyer-facing product category.
 *
 * **Current category:** `BRAND_CATEGORY` — Architecture Proof Engine (lead promise:
 * defensible architecture, on demand).
 *
 * Historical labels remain exported so SEO redirects, analytics tag mappers, and
 * outbound legacy citations resolve without scattering literals across surfaces:
 * `BRAND_CATEGORY_LEGACY` — intermediate V1 label ("AI Architecture Review Board").
 * `BRAND_CATEGORY_LEGACY_ORIGINAL` — original coined category ("AI Architecture Intelligence").
 *
 * To rebrand again:
 *   1. Change `BRAND_CATEGORY` here; rotate legacy exports if outbound links still target older phrases.
 *   2. Run `npm run rebrand-check` (or `python scripts/ci/assert_brand_category_seam.py`) from repo root.
 *   3. Flip tracked phrases in `scripts/ci/assert_brand_category_seam.py` if the forbidden list changes.
 *
 * CI guard `scripts/ci/assert_brand_category_seam.py`: seam allowlists literals here only.
 */

export const BRAND_CATEGORY = "Architecture Proof Engine";

/**
 * Canonical scope qualifier for the category's "proof" claim — rendered as quiet
 * supporting copy wherever the category name is presented as an explainer.
 * Source of truth: docs/go-to-market/POSITIONING.md §5 "What proof means here".
 */
export const BRAND_PROOF_SCOPE_STATEMENT =
  "Proof of diligence, not a performance guarantee: every finding traces to evidence, and the finalized package is hash-verified and auditable.";

export const BRAND_CATEGORY_LEGACY = "AI Architecture Review Board";

export const BRAND_CATEGORY_LEGACY_ORIGINAL = "AI Architecture Intelligence";
