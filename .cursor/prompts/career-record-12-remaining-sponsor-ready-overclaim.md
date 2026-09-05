# CR-12 — Remaining sponsor chrome does not screenshot grade as Ready

**Do not fork SD-12** (finding-classification chips / CLI dumps). **Do not fork FD-13** (`StatusTag kind="ready"` on Decision-grade). **Do not fork IS-06 / LS-12** (stamp / Ask / sponsor honesty strip). This file is leftover **sponsor email and KPI** that still bind finding grade or package completeness to `StatusTag kind="ready"` / Ready.

## Why

Sponsors screenshot email and KPI tiles. Ready means workflow ready (design system). Binding Decision-grade or “would allow commit” to Ready on a career-facing export is false confidence.

## Goal

`EmailRunToSponsorExportActions` and remaining sponsor KPI tags use workflow-accurate labels (Finalized, Needs attention, Infeasible, Checklist coverage vs Decision-grade). `kind="ready"` stays for true ready/approved/configured workflow state (auth domains, budget configured, recycle-bin empty) — not insight-density classification.

## Context

- `archlucid-ui/src/components/EmailRunToSponsorExportActions.tsx` (`kind="ready"`)
- `SponsorRoiDashboardLiveKpiCards.tsx` / coverage honesty strip (WA-08 / LS-12 — do not fork the strip; fix remaining Ready-as-grade)
- `PolicyPackImpactPreviewPanel.tsx` “Would allow commit” as Ready — if it screenshots as approval, switch kind
- `RunDetailPackageStatusStrip.tsx` Finalized + `kind="ready"` is workflow-accurate — **leave**
- SD-12 CLI — do not restyle CLI here unless a sponsor email embeds CLI dumps

## What to build

1. Inventory sponsor email + KPI `kind="ready"` near findings/coverage. Switch classification to IS-07 vocabulary; keep Ready for finalized/configured workflow.
2. Vitest: sponsor email fixture with checklist + Decision-grade rows does not render a Ready tag for classification.
3. Do not change marketing Recommended tiles.

## Acceptance criteria

- Sponsor email actions do not label finding classification Ready.
- Package Finalized may still use `kind="ready"`.
- Gate method unchanged.

## Constraints

- Do not demote via LLM judge.
- Do not delete typed-engine rows.
- Do not claim third-party pen test or CPA SOC 2.
