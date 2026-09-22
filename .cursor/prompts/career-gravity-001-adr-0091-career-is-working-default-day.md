# CG-001 — ADR 0091: Career is the Working default day

**Wave:** career-gravity (livelihood UX wave 24) (**CG**). **Cluster:** kernel-adr. **Depends on:** none — run first.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Author `docs/architecture/adrs/0091-career-is-working-default-day.md` (Proposed). Decision: on Working production seats, **Career is the default execute gravity**. Rehearsal is an explicit door. ADR 0086 doors stay; this ADR forbids unlabeled Simulator as the day’s work. Host `AgentExecution:Mode` default may remain Simulator. No G-REAL-06.

## Why

AS-076–085 shipped chooser chrome. The remaining livelihood failure is gravity: a Working day can still *feel* like Career while structural Mode is Simulator.

## Context

- ADR 0086 (Proposed) · AS-076–085 · LP-06 `simulator-career-honesty.ts`
- `docs/architecture/adrs/README.md` (next number **0091**)
- `docs/architecture/adrs/template.md`

## What to build

1. Write ADR 0091 with numbered Decision, Trade-offs, Constraints, Expected impact (include **security** — authority-borrowing in ARB packets), Consequences.
2. README row. Proposed in this PR is OK.
3. Guard test: file exists; does not flip host Mode; does not merge kernels.
4. Do **not** change chooser UI in this prompt (CG-016+).

## Acceptance criteria

PR review can quote 0091 for “is Simulator the unlabeled Working day?” → No.

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
- **Do not** re-run AS-076–085, LP-06, FC, WS bodies except as a named leftover. **Do not** implement G-REAL-06. Career vs Rehearsal stays product chrome plus run stamp, not a host-config flip.
- Leftover owner: AS-076 (do not rewrite 0086 body). **Do not re-implement that file.** Implement only *What to build*.
