# CG-015 — Legacy Simulator clones grandfather Rehearsal with banner

**Wave:** career-gravity (livelihood UX wave 24) (**CG**). **Cluster:** door-persist. **Depends on:** CG-014.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Local/dev clones with `AgentExecution:Mode=Simulator` grandfather **Rehearsal** and show a persistent Working banner. They must not look like Career-complete.

## Why

AOAI-less clones must keep working. They must not mint ARB packets.

## Context

- host Mode Simulator · Working banner · AS-078 blocked Career

## What to build

1. When host is Simulator-pinned, effective door is Rehearsal unless Career is explicitly blocked-honesty (AS-078).
2. Banner copy: rehearsal, not sample, not Guided.
3. Do not auto-switch to Guided.

## Acceptance criteria

Simulator clone is usable and obviously not Career.

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
- Leftover owner: AS-078 / AS-085. **Do not re-implement that file.** Implement only *What to build*.
