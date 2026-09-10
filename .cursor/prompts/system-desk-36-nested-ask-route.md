# SY-36 — App Router: `/architecture/architectures/{architectureId}/ask`

Do not fork Ask client internals (WA-07 honesty). New page that mounts existing Ask with architecture scope.

## Goal

Add Working nested Ask route. Reuse Ask client; require architectureId in the path. Scope run id via `resolve-open-architecture-job-run-id` (AO-30). Empty: Start review on this architecture.

## Why

This is the load-bearing URL for ADR 0079. Query-param bind on `/insights/ask-review-questions` keeps Ask a peer product.

## Context

- `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/page.tsx`
- Ask page under `insights/ask-review-questions`
- `archlucid-ui/src/lib/architecture/architecture-routes.ts`

## What to build

1. `architectureNestedAskPath` helper.
2. `app/(operator)/architecture/architectures/[architectureId]/ask/page.tsx` (thin).
3. 404 if architectureId not in tenant scope (existing identity GET).
4. Vitest helper + optional RTL empty state.
5. Do not delete peer Ask page (SY-06 / SY-37).

## Acceptance criteria

- Nested path renders Ask scoped to that architectureId.

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

