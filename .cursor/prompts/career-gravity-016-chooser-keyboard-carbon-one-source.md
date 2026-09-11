# CG-016 — Chooser: keyboard, Carbon, one source of truth

**Wave:** career-gravity (livelihood UX wave 24) (**CG**). **Cluster:** chrome. **Depends on:** CG-011.

Do not implement from the wave index. Implement only *What to build*.

## Goal

One Working Career/Rehearsal control (command bar). Keyboard reachable. Duplicate mount on findings workspace must not drift.

## Why

`WorkingCareerRehearsalChooser` is mounted in top bar and findings workspace. Two sources diverge.

## Context

- `components/workspace-mode/WorkingCareerRehearsalChooser.tsx`
- `components/governance/WorkingCareerRehearsalChooser.tsx`
- `RunDetailFindingsWorkspace.tsx` · `OperatorShellTopBar.tsx`

## What to build

1. Single exported chooser; findings mount re-exports or one wrapper.
2. Keyboard: arrow/segment + aria.
3. Guided still returns null (AS-081).
4. Do not add a third chooser.

## Acceptance criteria

One test id family. Findings and top bar cannot disagree.

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
- Leftover owner: AS-077 leftover duplicate. **Do not re-implement that file.** Implement only *What to build*.
