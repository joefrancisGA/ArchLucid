# AO-12 — Guided/demo/trial keep peer review URLs as teaching

**Do not delete Guided eval chrome (PC-04 / CA-36 / ADR 0067).** This prompt is the split test.

## Goal

Guided, demo, and trial continue to use `/architecture/reviews/{id}` and the reviews hub as a teaching product. Working tests must not force Guided onto nested routes.

Add an explicit fixture matrix: Working nested vs Guided peer — so later AO files cannot “simplify” by deleting Guided paths.

## Why

AO-04–11 will accidentally homogenize eval if nobody owns the split. First-run teaching still needs a linear review URL.

## Context

- workspace mode flags / `resolveProductionDeskChrome`
- first-run wizard e2e
- CA-36

## What to build

1. Document the matrix in `architecture-routes.ts` JSDoc or a tiny `working-vs-guided-routes.md` comment in the helper test file (prefer test, not a new docs novel).
2. Vitest: Guided `reviewDetailPath` still used by Guided start fixtures.
3. Working fixtures assert nested builders.

## Acceptance criteria

- Do not auto-switch stored Guided users to Working.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, or 0074 bodies — Related pointers only. This wave **supersedes** 0072’s Working locator and 0069’s in-flight-review-first Start clause via **ADR 0077**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run CA-01–50, DA-01–12, PC-01–13, DR-01–16, or LK except as a named leftover.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).
