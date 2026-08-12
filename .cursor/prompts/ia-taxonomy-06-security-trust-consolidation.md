# IA taxonomy 06 — Security & Trust materials consolidation

> **Not yet executed.** Base branch: `master`. Depends on `ia-taxonomy-01`. Full categorization:
> `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md` § "Category 5".

## Goal

Resolve the overlap between the three trust/security surfaces (`/trust`, `/security-trust`,
`/settings/security-trust`), de-duplicate the four copies of the trust-center source markdown, and
ensure the buyer/procurement assurance packet (CAIQ, SOC2 self-assessment, pen-test summaries) is
downloadable without an account — all while staying inside this repo's existing V1/V1.1 scoping
rules for SOC 2 CPA attestation and third-party pen-testing.

## Guardrail — read before starting

SOC 2 **CPA attestation** and **third-party pen-test program** work (**TB-135**/**TB-136**, both
tech-tracking **Done**) is out of scope for this phase. **Nothing in this phase should imply or
schedule that work.** This phase only
reorganizes and de-duplicates *existing* self-assessment/owner-conducted-pen-test material
(`docs/security/SOC2_SELF_ASSESSMENT_2026.md`, `docs/security/pen-test-summaries/`) — it does not
commission new attestation or third-party testing.

## Context

- Public: `/trust` (`trust/page.tsx`, `MarketingTrustCenterBuyerBody.tsx`, sourced from
  `docs/go-to-market/trust-center.md` via `readTrustCenterMarkdown`) and `/security-trust`
  (`security-trust/page.tsx`, `MarketingSecurityTrustView.tsx`, sourced from
  `archlucid-ui/src/lib/security-trust-content.ts`). Two public pages, two content sources, unclear
  distinction from a buyer's perspective.
- Signed-in: `/settings/security-trust` (nav-canonical URL, rewrites to
  `workspace/security-trust/page.tsx`, `OperatorSecurityTrustPageView.tsx`,
  `operator-security-trust-content.ts`) — tenant isolation model, DPA/CAIQ links, for an
  authenticated procurement reviewer or tenant admin.
- **Duplicate trust-center markdown** (four files, one canonical needed):
  `docs/trust-center.md`, `docs/go-to-market/trust-center.md`, `docs/go-to-market/trust-center.md`,
  `docs/security/trust-center.md`. Diff all four before deciding which is authoritative — do not
  assume the newest-modified one is correct without checking content drift.
- Assurance packet material already exists and is largely buyer-safe by design:
  `docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`, `docs/security/SOC2_SELF_ASSESSMENT_2026.md`,
  `docs/compliance/CAIQ_LITE.md`, `docs/security/SIG_CORE_2026.md`, `docs/security/pen-test-summaries/`.
- Related content also in scope for cross-linking (not merging): `docs/go-to-market/TENANT_ISOLATION.md`,
  `docs/go-to-market/SUBPROCESSORS.md` (in-app slug `subprocessors`),
  `docs/library/customer-facing/HOW_IT_WORKS.md`, `docs/go-to-market/AI_READINESS_POSTURE.md`,
  `docs/library/AUDIT_COVERAGE_MATRIX.md`.

## What to build

### 1. De-duplicate trust-center markdown

- Diff `docs/trust-center.md`, `docs/go-to-market/trust-center.md`, `docs/go-to-market/trust-center.md`,
  `docs/security/trust-center.md`. Pick one canonical file (default assumption, verify: the one
  `readTrustCenterMarkdown` actually reads for `/trust` today — check that function's import path
  first) and turn the other three into short pointer files (a one-line "see X" redirect notice) or
  remove them if nothing else in the repo links to them (grep for references before deleting).

### 2. Resolve `/trust` vs `/security-trust` overlap

- Read both pages' current rendered content side by side and produce a recommendation in the PR
  description: either (a) merge `/security-trust` into `/trust` as a section/anchor and 301-redirect
  the old URL, or (b) keep both but make the distinction explicit in each page's own copy (e.g.
  `/trust` = full trust center narrative + downloads, `/security-trust` = one-page executive summary
  that links to `/trust` for depth). Do not implement a redirect (option a) without checking this
  against `MARKETING_SITEMAP_PATHNAMES` / `MARKETING_ROBOTS_DISALLOW_PREFIXES` and any existing
  inbound-link/SEO consideration; default to option (b) unless the content diff shows near-total
  duplication.

### 3. Buyer-safe assurance packet downloads

- Verify each of `BUYER_SECURITY_PROCUREMENT_PACKET.md`, `SOC2_SELF_ASSESSMENT_2026.md`,
  `CAIQ_LITE.md`, `SIG_CORE_2026.md`, and the pen-test summaries is linked from `/trust` (or
  `/security-trust`, per the outcome of § 2) as a direct download/view link reachable without
  authentication. If any currently requires signing in (e.g. only linked from
  `/settings/security-trust`), add the public-safe version of that link to the public page instead
  of moving the authenticated deep-dive.
- If no PDF versions exist yet, browser print-to-PDF on the rendered markdown page is an acceptable
  v1 (same approach as phase 03's technical-docs export) — do not build a new PDF pipeline for this
  phase alone if the phase 03 mechanism can be reused.

### 4. Cross-link tenant isolation / subprocessors / AI handling / audit trail

- Ensure `/trust` (or wherever § 2 lands the canonical public page) links out to
  `TENANT_ISOLATION.md`, `subprocessors`, `HOW_IT_WORKS.md`, and `AUDIT_COVERAGE_MATRIX.md` content
  — via existing `/help/{slug}` entries where they already exist (`subprocessors`, `how-it-works`)
  rather than duplicating that content again on the trust page.

## Tests

- Add a test asserting `readTrustCenterMarkdown` (or whichever function is confirmed canonical in
  § 1) reads from exactly one file, and the other three are either removed or contain only a
  pointer (a simple line-count/pattern assertion is enough — do not over-engineer this check).
- If a redirect is added in § 2 option (a), add a redirect test consistent with existing
  `next.config.ts` redirect test conventions.
- Add a test asserting the assurance-packet links on the public trust page resolve without
  requiring an authenticated session (e.g. a Playwright test that loads `/trust` unauthenticated
  and checks the packet links are present and not gated).

## Acceptance criteria

- Exactly one canonical trust-center markdown source; the other three are pointers or removed.
- `/trust` and `/security-trust` have a documented, non-arbitrary distinction (merged with redirect,
  or explicitly differentiated) — not two pages doing the same job by accident.
- CAIQ, SOC2 self-assessment, and pen-test summary material is reachable and downloadable from a
  public page without authentication.
- No implication anywhere in this change that ArchLucid has commissioned CPA-attested SOC 2 or
  third-party pen-testing.

## Non-goals

- Do not commission, describe as in-progress, or schedule SOC 2 CPA attestation or third-party
  pen-testing (V1.1-parked, TB-135/TB-136 only on explicit owner direction).
- Do not change `/settings/security-trust` (the signed-in procurement deep-dive) beyond adding
  cross-links if useful — its audience and depth are already appropriate for Category 5's
  "signed-in" half.

## References

- `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`
- `.cursor/prompts/ia-taxonomy-01-foundation-doc-and-registry-metadata.md`
- `docs/go-to-market/trust-center.md`, `docs/security/SOC2_SELF_ASSESSMENT_2026.md`,
  `docs/compliance/CAIQ_LITE.md`, `docs/security/pen-test-summaries/`

## Commit / PR

- Do not commit or open a PR from this prompt without the user naming a target branch at
  execution time (base is `master`).
