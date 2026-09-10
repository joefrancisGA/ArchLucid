# SY-18 — Working first-review guide uses nested architecture URLs

Do not fork the guide’s live-recovery no-sample rule (`isLiveOperatorShellRecoveryContext`). Change href builders only on Working.

## Goal

`first-review-guide-status.ts` helpers `reviewDetailHref` / findings / finalize / share: Working with known `architectureId` must use `resolveArchitectureReviewHref` / nested paths. Guided may keep `reviewDetailPath`.

## Why

The first-week guide is how new seatholders learn what to bookmark. It still mints peer run URLs.

## Context

- `archlucid-ui/src/lib/first-review-guide-status.ts`
- `archlucid-ui/src/lib/use-first-review-guide-state.ts` (if present)

## What to build

1. Thread architectureId into the guide state when Working.
2. Vitest for Working vs Guided hrefs.
3. Do not restore sample run recovery on live Working.

## Acceptance criteria

- Working guide actionHref never matches `/architecture/reviews/{guid}` when architectureId is set.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip. A desk **command bar** or nested tool route is not a More menu for those tabs.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0079** (desk is the work surface) and **Accepts ADR 0077** when the locator already shipped.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run AO-01–50, CA-01–50, DA-01–12, PC-01–13, DR-01–16, FC-01–80, or LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).

