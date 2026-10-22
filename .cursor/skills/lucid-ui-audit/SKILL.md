---
name: lucid-ui-audit
description: >-
  Runs the ArchLucid persona-driven UX audit for archlucid-ui: Playwright screenshot
  capture (buyer-polished, full architect workspace, and marketing entry points), rubric review
  against buyer personas and UI design system, and a dated audit report under docs/architecture/.
  Use when the user asks to run a UX audit, re-run lucid-ui-audit, /lucid-ui-audit,
  persona screenshot audit, or buyer vs architect workspace comparison.
disable-model-invocation: false
---

# lucid-ui-audit — ArchLucid UI persona UX audit

Repeatable workflow for screenshot-backed UX audits of `archlucid-ui`. Compares **buyer-polished** demo shell vs **full architect workspace** (npm/CI mode still named `operator`) across persona-mapped routes, plus **marketing** `/welcome` and `/why`.

## Capture (one command)

From `archlucid-ui/`:

```powershell
npm run ux-audit
```

Or from repo root:

```powershell
.\archlucid-ui\scripts\run-ux-audit.ps1
```

Flags: `-ScreenshotsOnly`, `-BuyerOnly`, `-OperatorOnly`, `-MarketingOnly`, `-SkipReport`.

Individual modes:

- `npm run ux-audit:screenshots:buyer` → `public/screenshots/ux-audit/buyer/*.png` (14 routes)
- `npm run ux-audit:screenshots:operator` → `public/screenshots/ux-audit/operator/*.png` (14 routes)
- `npm run ux-audit:screenshots:marketing` → `public/screenshots/ux-audit/marketing/*.png` (2 routes)

**Build note:** buyer and architect-workspace (`operator`) captures require **separate Next builds** (`NEXT_PUBLIC_*` is inlined at build time). `run-ux-audit.ps1` runs full builds per mode; marketing reuses the buyer build when captured in the same session.

## Review rubric

1. `docs/go-to-market/BUYER_PERSONAS.md` — rejection criteria per persona
2. `docs/library/UI_DESIGN_SYSTEM.md` — status tags, vocabulary, density
3. Pair buyer vs architect-workspace (`operator`) PNGs for the same slug; note regressions visible only in the full workspace

## Report output

Write `docs/architecture/UX_AUDIT_YYYY_MM_DD.md` with executive summary, findings table (severity, persona, slug, recommendation), and regression pointers to backlog IDs when fixes are needed.

## Code anchors

- Route registry: `archlucid-ui/e2e/ux-audit-route-registry.ts`
- Harness contract + drift guard: `archlucid-ui/e2e/ux-audit-harness-contract.ts`, `archlucid-ui/scripts/ux-audit-harness-drift-guard.test.ts`
- Playwright spec: `archlucid-ui/e2e/ux-audit-screenshots.spec.ts`
- Audit trail capture uses scoped `/audit?runId={showcase}` (TB-649)

## Maintenance (TB-653)

Re-run `npm run ux-audit` (or ask the agent to run **lucid-ui-audit**) after changes to:

- Architect workspace / buyer polish flags (`NEXT_PUBLIC_*` build-time env; CI/npm still say `operator`)
- Sidebar nav, intake wizard, or persona-mapped routes in `ux-audit-route-registry.ts`
- Playwright mock configs or `run-ux-audit.ps1` port alignment

**Quarterly cadence:** at least once per quarter, capture all **30** PNGs (14 buyer + 14 operator + 2 marketing) and write `docs/architecture/UX_AUDIT_YYYY_MM_DD.md`. The drift guard blocks accidental removal of `testIgnore: ['**/.next/**']` or coupling UX audit screenshots into merge-blocking `test:e2e:mock:operator-shell` CI.

When capture routes or env vars change, update `ux-audit-route-registry.ts`, `ux-audit-harness-contract.ts` if needed, and this skill in the same PR.
