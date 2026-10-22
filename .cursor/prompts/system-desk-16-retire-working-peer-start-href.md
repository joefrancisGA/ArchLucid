# SY-16 — Working stops using `startReviewFromArchitectureHref` (peer /reviews/new)

Do not fork AO-22. The nested helper already exists; this prompt deletes Working call sites of the peer helper.

## Goal

All Working production callers use `startReviewFromArchitectureNestedHref` / `architectureNestedStartReviewPath`. Keep `startReviewFromArchitectureHref` as Guided/legacy or wrap it so Working never hits `REVIEWS_NEW_PATH`.

## Why

`architecture-routes.ts` still exports a peer start that puts `sourceArchitectureId` on `/architecture/reviews/new`. Home tests still expect that href. That is a second start product.

## Context

- `archlucid-ui/src/lib/architecture/architecture-routes.ts`
- `archlucid-ui/src/components/operator-home/OperatorHomeWorkingPrimaryCta.test.tsx`
- `archlucid-ui/src/lib/architecture/architecture-nested-start-review-routes.test.ts`

## What to build

1. Switch Working callers + tests.
2. JSDoc: peer helper = Guided/legacy.
3. Vitest: Working CTA module does not import `startReviewFromArchitectureHref`.

## Acceptance criteria

- Nested start path is the only Working start-review URL.

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

