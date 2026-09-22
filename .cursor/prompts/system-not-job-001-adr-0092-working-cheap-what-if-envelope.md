# SN-001 — ADR 0092: Working cheap what-if envelope (no kernel merge)

**Wave:** system-not-job (livelihood UX wave 25) (**SN**). **Cluster:** kernel-adr. **Depends on:** none — run first.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Author ADR 0092 (Proposed). Decision: Working may run a **labeled what-if envelope** without treating it as a Career seal. Persistence stays two kernels (ADR 0068). Career what-if remains a capped full pipeline run (R12). Cheap envelope is Rehearsal-stamped or explicitly labeled incomplete. Do not Compare unsealed drafts as Career proof.

## Why

R12 made every branch a billable full run. All-day thinking needs cheap sketches. Merging tables would destroy the seal. The envelope must not launder Career.

## Context

- R12 · ADR 0068 · WA-10 · impact preview · CG stamp (wave 24)

## What to build

1. ADR + README **0092**.
2. Constraints: no table merge, no unseal, no unlabeled Career, no G-REAL-06.
3. Guard test.
4. Do not implement the runner here (SN-008+).

## Acceptance criteria

Quoteable: may we Compare two unsealed drafts as Career? No. May Working sketch a labeled envelope? Yes.

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
- Leftover owner: R12 / ADR 0068 (do not rewrite bodies). **Do not re-implement that file.** Implement only *What to build*.
