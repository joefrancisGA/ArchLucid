> **Scope:** Lightweight author evidence for critical operator routes; complements automated axe checks and is not formal WCAG certification or AT lab sign-off.

# Manual Accessibility Spot-Check Evidence

**Last reviewed:** 2026-05-28

## Priority First-Pilot Routes

Use this checklist when a PR touches `archlucid-ui/src/app/(operator)/`, shared interactive components, route load/error shells, navigation, dialogs, inspectors, or review-package flows.

| Route | Keyboard | Focus | 200% zoom | Reduced motion | Screen-reader spot check | Evidence notes |
| --- | --- | --- | --- | --- | --- | --- |
| Home `/` | Required | Required | Required | Required | Recommended | First-pilot command center, operating rail, and trial widgets. Automated: `operator-first-pilot-routes-axe.test.tsx`, `operator-shell-components-axe.test.tsx`. |
| New review `/reviews/new` | Required | Required | Required | Required | Recommended | Wizard labels, validation messages, and action order. |
| Reviews list `/reviews?projectId=default` | Required | Required | Required | Required | Recommended | Filters, featured package row, and empty/error states. |
| Review detail `/reviews/{runId}` | Required | Required | Required | Required | Recommended | Rationale, findings, exports, dialogs, and forensic panels. |
| Architecture snapshot / artifact review `/manifests/{manifestId}` | Required | Required | Required | Required | Recommended | Metadata, preview, raw disclosure, sibling artifact list. |
| Compare `/compare` | Required | Required | Required | Required | Optional | Side-by-side content and overflow behavior. Automated: `operator-analysis-axe.test.tsx`. |
| Audit `/audit` | Required | Required | Required | Required | Recommended | Search/filter controls, timeline cards, and download actions. |
| Settings `/settings` and identity `/settings/identity-providers` | Required | Required | Required | Required | Recommended | Support bundle and read-only auth catalog rows. Automated: `operator-first-pilot-routes-axe.test.tsx`. |
| Accessibility statement `/accessibility` | Required | Required | Required | Required | Recommended | Public policy route and target-conformance wording. |

## Author Checklist

For each touched critical route:

- [ ] Automated route/component axe evidence remains green, or the failure is filed separately with owner and target date.
- [ ] Keyboard path is logical with Tab and Shift+Tab; Enter/Space activates controls; Escape closes dismissible layers.
- [ ] Visible focus is never hidden behind sticky chrome, overlays, or scroll containers.
- [ ] 200% zoom keeps primary actions, form labels, tables, and status badges readable without horizontal page-level scrolling except where data grids intentionally scroll.
- [ ] Reduced motion mode does not block progress or hide status updates.
- [ ] Screen-reader spot check confirms page heading, landmarks, form labels, alert regions, and dialog names are understandable.
- [ ] Evidence note names the route, browser, viewport, date, tester, and any known limitation.

## Example Completed Evidence

This example is a template-quality record, not certification:

| Field | Value |
| --- | --- |
| Date | 2026-05-28 |
| Tester | Product owner |
| Route | Home `/` |
| Browser / viewport | Edge, 1440 x 900 and 200% zoom |
| Automated evidence | `operator-first-pilot-routes-axe.test.tsx`, `operator-shell-components-axe.test.tsx`; live route list remains in `live-api-accessibility.spec.ts` when enabled. |
| Keyboard result | Pass: first-pilot command center links and operating rail are reachable in logical order. |
| Focus result | Pass: focus rings remain visible on cockpit CTAs and nav links. |
| Reduced motion result | Pass: status cards remain usable with OS reduced-motion preference. |
| Screen-reader spot check | Not completed in this example; recommended before external accessibility questionnaire responses. |
| Caveat | Manual author check only; no formal WCAG certification or participant AT lab testing claimed. |

## PR Guidance

Attach a short evidence note to PRs that touch critical operator routes or shared components. If a manual check is not applicable, state why. Do not weaken existing axe gates to make a manual note pass.
