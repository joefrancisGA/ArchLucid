# CG-002 — Inventory unlabeled Simulator Ready surfaces

**Wave:** career-gravity (livelihood UX wave 24) (**CG**). **Cluster:** inventory. **Depends on:** CG-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Produce `docs/architecture/CAREER_GRAVITY_UNLABELED_READY_INVENTORY.md`: every Working surface that can show Ready / complete / finalize-able while structural execute is Simulator/Fallback without Rehearsal labeling.

## Why

Chooser chrome does not help if pipeline copy, badges, and CTAs still screenshot as Career.

## Context

- `RunStatusBadge.tsx` · `RunProgressTracker.tsx` · `RunDetailPreFinalizeGateHonestyStrip.tsx`
- `simulator-career-honesty.ts` · LP-18 Ready leftover

## What to build

1. Grep Working UI for Ready / finalize / complete / career-complete.
2. Table: path, string, whether LP-06/AS-079 already covers it, leak class.
3. Vitest that the inventory file is referenced from a shrink-only guard (list may start as documentation).
4. Do **not** change copy yet (CG-021+).

## Acceptance criteria

Every Ready-looking Working surface is named. New leaks cannot hide in unlisted files.

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
- Leftover owner: AS-079 / LP-18. **Do not re-implement that file.** Implement only *What to build*.
