# Live demo refinement (`/live-demo`) — TB-960

**Date:** 2026-07-23  
**Route:** `/live-demo`  
**Backlog:** TB-960 (Adoption friction P0)

## Summary

`/live-demo` was a long-form marketing case study reusing `DemoPreviewMarketingBody` with a **Sample walkthrough** title mismatch, all five artifact sections expanded at once, competing conversion panels, and a collapsible **Technical details** block. It is now a guided, read-only product demonstration with one active step at a time, stable deep links, and a single conversion section.

## Identity decision

| Surface | Before | After |
| --- | --- | --- |
| Browser title | ArchLucid · Sample walkthrough | ArchLucid · Live demo |
| `<h1>` | Sample walkthrough / Live sample review | **Live demo** |
| Secondary label | — | “Sample walkthrough” eyebrow only |
| Subtitle | Procurement/sponsor copy | Guided read-only review using fabricated sample data |
| Marketing nav | Live demo (unchanged) | Live demo |

## Walkthrough design

- Five steps: Sponsor summary → Signed review record → Evidence graph → Governance approval → Audit trail.
- `LiveDemoWalkthroughShell` (client): compact stepper, Previous/Next, `?step=` URL sync, optional “View full walkthrough” continuous mode.
- Each step panel: product preview from sample payload → key takeaway → one inspect action.
- Initial paint is server-rendered; only the shell and active step panel hydrate on the client.

## Sample routes reused

- Payload: same `GET /v1/public/demo/sample-run` chain as before, with static fallback via `getShowcaseStaticDemoPayload(claims-intake-modernization)`.
- Inspect actions use `resolveLiveDemoInspectHref`:
  - When `canShowcaseAnonymousVisitorOpenOperatorDeepLinks` is true → operator read-only routes (`/reviews/...`, `/graph`, `/governance`, `/audit`, `/signed-records/...`).
  - Otherwise → public `/showcase/claims-intake-modernization` (no auth trap).

## Content removed / consolidated

- Removed from live-demo path: **Technical details** accordion, per-milestone “View” links on lifecycle, duplicate sign-in callout in body, competing evaluation + sign-in CTA panels from `DemoPreviewMarketingBody`.
- Added: **Review integrity** buyer-facing section, condensed milestone timeline, deliverables inside audit step, evidence-chain text preview (no new graph library).

## Conversion hierarchy

1. **Start your evaluation** → `/get-started`
2. **Request an enterprise demo** → `/pricing#pricing-quote-request`
3. **Explore the full read-only review** → showcase or operator review (per link guard)

Sign-in remains in marketing header only (not repeated in body).

## Analytics

App Insights events via `live-demo-telemetry.ts`:

- `LiveDemoWalkthroughStarted`
- `LiveDemoStepViewed` (`stepId`)
- `LiveDemoArtifactOpened` (`destination`)
- `LiveDemoConversionClick` (`action`)

## Accessibility

- Page-level `<h1>`, stepper `aria-current="step"`, active panel `aria-live="polite"`.
- Evidence chain rendered as ordered list with text labels (graph text equivalent).
- Keyboard-activatable stepper buttons.

## Performance

- ISR `revalidate = 300` preserved.
- Single active step rendered in guided mode (lazy by visibility).
- No new heavy client bundles; reuses existing UI primitives.

## Files changed

- `archlucid-ui/src/app/(marketing)/live-demo/page.tsx`
- `archlucid-ui/src/app/(marketing)/live-demo/LiveDemo*.tsx` (body, shell, step panels, CTA, integrity, deliverables, evidence chain)
- `archlucid-ui/src/lib/live-demo-page-copy.ts`
- `archlucid-ui/src/lib/live-demo-walkthrough-steps.ts`
- `archlucid-ui/src/lib/live-demo-public-links.ts`
- `archlucid-ui/src/lib/live-demo-telemetry.ts`
- Tests: `live-demo-marketing-body.test.tsx`, `live-demo-public-links.test.ts`

## Tests

- Vitest: walkthrough shell render, five stepper controls, no Technical details, public link guards.

## Remaining limitations

- `/demo/preview` and `/showcase/[runId]` still use the legacy long-form `DemoPreviewMarketingBody` (intentionally out of TB-960 scope).
- Continuous walkthrough mode expands all steps but does not lazy-load below-fold step content.
- Operator deep links on inspect actions require demo-mode env flags (TB-890 contract unchanged).
