# AO-24 — Current draft is a pane of the architecture, not a second website

**Do not fork CA-28 / ADR 0071 undo.** Editor may be nested route; chrome stays the identity.

## Goal

Working draft editing happens as a desk pane or nested draft route **with identity header**. Closing the editor returns to the desk, not to `/architecture/architectures` list.

Spawn-locked: pane shows handoff, not a second product.

## Why

Draft-as-site is how people bookmark the wrong id. Pane-as-child matches Excel sheet-within-workbook.

## Context

- CA-28 current draft / new version
- nested draft route AO-05
- document undo ADR 0071

## What to build

1. Identity header visible on draft editor Working.
2. Back/close → identity desk.
3. Vitest: spawn-locked pane has no autosave.

## Acceptance criteria

- Undo stack still in-session (0071). Do not put undo in localStorage as SoT.

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
