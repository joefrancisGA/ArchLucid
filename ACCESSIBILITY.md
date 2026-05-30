# Accessibility

Last reviewed: 2026-05-27

## Target compliance level

**WCAG 2.2 Level AA** — the ArchLucid operator UI targets conformance with the [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) at Level AA, including WCAG 2.0/2.1 success criteria retained at that level.

Playwright axe runs attach the **`wcag22aa`** ruleset bundle alongside **`wcag21aa`** (see **`archlucid-ui/e2e/helpers/axe-helper.ts`**).

## Current status

**Baseline** — merge-blocking **`@axe-core/playwright`** runs against the `PAGES` list in [`archlucid-ui/e2e/live-api-accessibility.spec.ts`](archlucid-ui/e2e/live-api-accessibility.spec.ts) (**81** URL patterns as of 2026-05-27, including the **16** high-traffic operator and marketing paths in the table below, plus legacy `/onboarding` redirects, run provenance, findings (showcase run), manifest variants, governance findings/policy packs, settings surfaces, product-learning, executive reviews, and admin/help routes). Deferred matrix-only routes are documented as `PAGES_DEFERRED` in the same spec. Critical and serious violations are gated in CI; minor/moderate violations are tracked for incremental resolution.

Automated axe evidence supports procurement disclosure but **does not imply** formal WCAG certification or participant assistive-technology (AT) lab testing unless separately performed and documented.

Manual author spot-check evidence for critical operator routes lives in [`docs/quality/ACCESSIBILITY_MANUAL_SPOT_CHECK_EVIDENCE.md`](docs/quality/ACCESSIBILITY_MANUAL_SPOT_CHECK_EVIDENCE.md). Use it for keyboard, focus, zoom, reduced-motion, and screen-reader notes on touched first-pilot routes; it does not replace automated axe gates.

The **Vitest** axe job (`npm run test:axe-components`) is separate; see the **Tooling** table.

### Pages with automated checks

The following **16** routes are the **priority operator coverage** set (wizard, list/detail, compare, analysis, graph, governance, settings, marketing attestation, and shared pilot surfaces). They are a **subset** of the full `PAGES` array in the Playwright file above; CI scans **all** `PAGES` entries. Legacy `/runs/*` aliases remain scanned; canonical buyer paths use `/reviews/*`.

| Page | Route | Status |
| ---- | ----- | ------ |
| Home | `/` | Scanned |
| New review (wizard) | `/reviews/new` (alias `/runs/new`) | Scanned |
| Reviews list | `/reviews?projectId=default` (alias `/runs?projectId=default`) | Scanned |
| Review detail (fixture) | `/reviews/{runId}` (alias `/runs/{runId}`; see `e2e/fixtures/ids.ts`) | Scanned |
| Compare | `/compare` | Scanned |
| Ask | `/ask` | Scanned |
| Graph | `/graph` | Scanned |
| Advisory | `/advisory` | Scanned |
| Governance dashboard | `/governance/dashboard` | Scanned |
| Governance workflow | `/governance` | Scanned |
| Tenant settings | `/settings/tenant` | Scanned |
| Value report | `/value-report` | Scanned |
| Audit | `/audit` | Scanned |
| Policy packs | `/policy-packs` | Scanned |
| Alerts inbox (hub) | `/alerts` | Scanned |
| Accessibility statement (marketing) | `/accessibility` | Scanned |

## Tooling

| Tool                                      | Purpose              | Scope                 |
| ----------------------------------------- | -------------------- | --------------------- |
| **axe-core** via `@axe-core/playwright`   | Automated WCAG scan  | Playwright e2e suite  |
| **eslint-plugin-jsx-a11y**                | Static JSX linting   | ESLint (via Next.js)  |

CI enforcement: merge-blocking **`ui-e2e-live`** runs **`live-api-accessibility*.spec.ts`** (Playwright + **`@axe-core/playwright`**) against **live API + SQL**; critical/serious violations fail the job. Automation uses WCAG-aligned axe tags (**`wcag2a`/`wcag2aa`**, **`wcag21*`**, **`wcag22aa`**), not an exhaustive conformance claim against every 2.x Understanding footnote.

Fast component-level checks run in **`ui-axe-components`** via Vitest + **jest-axe** on **`archlucid-ui/src/accessibility/**`** plus additional primitive smoke tests (**`interactive-primitives-axe.test.tsx`**).

## Existing accessibility controls

- **Skip-to-content link**: first focusable element in `layout.tsx`, jumps to `#main-content` (visible on focus)
- **First-pilot operating rail**: ordered list with `aria-current="step"`, visible status labels, and troubleshooting links only on the active or attention step (`FirstPilotOperatingRail` on operator Home)
- **Language attribute**: `<html lang="en">`
- **Landmark navigation**: `<main>` on page components, `<nav>` with `aria-label` in `SidebarNav`, `<header>` in layout
- **Form labels**: `<label>` wrapping on audit, policy packs, and alerts controls
- **Focus management**: custom `focus-visible` styles for nav links, workflow actions, and auth controls (`globals.css`)
- **Error regions**: `role="alert"` on API error messages

## Known exemptions

None at this time. Document any intentional deviations here with:

- The axe rule ID being exempted
- The affected page(s)
- The justification
- The planned resolution date (if temporary)

## Review cadence

**Annually.** The next review window is **2027-04-25**. The public attestation surface is the marketing route **`/accessibility`** (source: `archlucid-ui/src/app/(marketing)/accessibility/page.tsx`; live site when published: **https://archlucid.net/accessibility**).

Place the **annual accessibility policy review** on the **same owner calendar** as the independent **quality-assessment** cadence reminder (dated assessment series under `docs/` and prompts such as [`docs/QUALITY_IMPROVEMENT_PROMPTS.md`](docs/library/QUALITY_IMPROVEMENT_PROMPTS.md)).

## Expanding coverage

To add accessibility checks for a new page:

1. Add an entry to the `PAGES` array in `archlucid-ui/e2e/live-api-accessibility.spec.ts` (and update this document’s table if the route is product-significant). CI guard: `python scripts/ci/assert_accessibility_route_evidence_freshness.py`.
2. For **live** e2e: ensure the live API + SQL happy path in `e2e/start-e2e-live-api.ts` / fixture IDs (`e2e/fixtures/ids.ts`) includes data for dynamic routes when needed. For **mock** Playwright: use `npx playwright test -c playwright.mock.config.ts` (that config ignores `live-api-*.spec.ts`).
3. For route-level axe against a live API, run `npx playwright test` from **`archlucid-ui/`** with **`ArchLucid.Api`** up (see **`docs/LIVE_E2E_HAPPY_PATH.md`**). For component axe only: **`npm run test:axe-components`**.

## Procurement disclosure

Canonical **VPAT® 2.5 / WCAG 2.1** Accessibility Conformance Report for procurement: [`docs/security/VPAT_2_5_WCAG_2_1_AA.md`](docs/security/VPAT_2_5_WCAG_2_1_AA.md) (criteria-to-test evidence map: [`VPAT_EVIDENCE_MAP.md`](docs/security/VPAT_EVIDENCE_MAP.md)). **Participant assistive-technology user testing is not claimed complete.**

## Manual testing guidance

Automated scanning catches roughly **30–40%** of accessibility issues encountered in audits. Supplement with:

- **Keyboard navigation**: Tab, Shift+Tab, Enter, Escape through interactive elements — verify visible focus indicators, logical Tab order (including overlays such as narrow-viewport inspectors), and that focus returns sensibly after closing layers
- **Screen reader**: NVDA (Windows) or VoiceOver (macOS) — spot-check headings, landmarks, tables, wizard steps, filter/pagination **`aria-live`** regions, and `role="dialog"`/`aria-modal` patterns where Radix dialogs are used
- **Zoom**: 200% browser zoom — verify no clipping or overlapping
- **Reduced motion**: With **`prefers-reduced-motion: reduce`** enabled at the OS level, verify UI remains usable (**`globals.css`** coerces **`animation`** / **`transition`** durations toward zero for layered components)

Pull requests that touch **`archlucid-ui/src/app/(operator)/`** or **`archlucid-ui/src/components/`** should include at least one author keyboard pass (minimum: open the touched route, Esc closes modals, Tab does not leak focus from open overlays where trapping is intentional).

For critical first-pilot routes, use the evidence template in [`docs/quality/ACCESSIBILITY_MANUAL_SPOT_CHECK_EVIDENCE.md`](docs/quality/ACCESSIBILITY_MANUAL_SPOT_CHECK_EVIDENCE.md) so manual checks are distinguishable from automated axe evidence.
