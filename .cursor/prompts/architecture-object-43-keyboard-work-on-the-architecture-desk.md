# AO-43 — Keyboard work actions fire on the architecture desk

**Do not fork PC-11 / LK-11 / IS-10 / AD-10.** Desk is the default focus target.

## Goal

Working: shortcuts that mutate work (start review, resume in-flight, save draft, next-job) are documented and bound when the architecture desk is focused — not only when a peer review route is mounted.

Shift+? overlay lists architecture-desk actions first. AD-10: docs match listener mount.

## Why

Keyboard that only works on `/architecture/reviews/{id}` makes the nested desk a mouse product.

## Context

- KEYBOARD_SHORTCUTS.md
- shortcut-registry
- PC-11
- AD-10

## What to build

1. Bind resume/start on desk.
2. Overlay copy + Vitest.
3. No bare character-key shortcuts.

## Acceptance criteria

- Findings grid shortcuts still work inside the nested job.

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
