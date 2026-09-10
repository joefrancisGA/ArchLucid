# SY-09 — Alt+A on Working opens Ask as a desk verb

Do not fork AO-30 / WA-05. Same interim rule as SY-08 until SY-36.

## Goal

Working Alt+A opens nested Ask (SY-36) or the architecture desk Ask command — not bare `ASK_REVIEW_QUESTIONS_PATH`.

## Why

Ask without an architecture is a chatbot. Ask that lives on the system is the instrument R4 needs.

## Context

- `archlucid-ui/src/lib/ask-review-questions-route.ts`
- `archlucid-ui/src/lib/architecture/resolve-open-architecture-job-run-id.ts`
- `archlucid-ui/src/lib/shortcut-registry.ts`

## What to build

1. Working Ask shortcut resolver.
2. Vitest.
3. Honesty empty-state still names skipped MUST / quiet engines (do not strip FC/WA).

## Acceptance criteria

- Working Alt+A is not the unscoped Insights Ask island.

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

