# AO-36 — Clone-from-snapshot and new version stay parented

**Do not fork WA-10 / CA-28.** New draft must keep ArchitectureId.

## Goal

Working “new version” / clone from sealed snapshot creates a new **draft** of the **same** architecture (ensure identity, do not create a second identity). Navigation stays on that desk / nested draft.

Do not spawn a new architecture row for a version.

## Why

Clone that creates a new identity fragments the portfolio. Clone that drops parent repeats CA-16 at version time.

## Context

- WA-10 clone-from-snapshot
- CA-14 ensure on save
- CA-28

## What to build

1. Clone API/client sends ArchitectureId.
2. UI stays on desk.
3. Tests: identity count unchanged; new draft FK set.

## Acceptance criteria

- Spawn lock on the old draft unchanged.

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
