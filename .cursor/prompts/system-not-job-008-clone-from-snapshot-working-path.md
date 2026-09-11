# SN-008 — Clone-from-snapshot is the architecture sketch path

**Wave:** system-not-job (livelihood UX wave 25) (**SN**). **Cluster:** desk. **Depends on:** SN-001, SN-003.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Working desk: “New version (clone)” is visible after spawn. Clone is Rehearsal-stamped until Career execute. Do not re-implement WA-10 engine; mount it on the desk.

## Why

If clone is buried, people edit locked drafts.

## Context

- WA-10 · architecture desk

## What to build

1. Desk CTA + confirm cost if full run.
2. Inherits CG door rules.
3. Palette action when spawn-locked.

## Acceptance criteria

Done when *What to build* is true and any tests named there pass. Working vs Guided split holds unless this prompt says otherwise.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** merge tables. **Do not** draft-diff Compare. Cheap envelope ADR **0092**; runner mounts in **CE**. **Do not** re-run SY/WA-10 except leftovers.
- Leftover owner: ADR 0068 / SY / WA-10 / R12 — implement only leftover. **Do not re-implement that file.** Implement only *What to build*.
