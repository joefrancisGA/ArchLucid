# RP-006 — Status, pipeline, and progress copy

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** copy. **Depends on:** RP-005.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Run status badge, progress tracker, and pipeline-complete labels follow the glossary. `Career complete` → `Record complete`. `Career blocked` → `Sealed record blocked`. `Career seal blocked` → `Sealed record blocked`. `Rehearsal complete — not career-complete` → `Practice complete — not record-complete`.

## Why

Badges are the densest leftover after the dialog. Aria-labels are included.

## Context

- `run-status-badge-career-honesty.ts`
- `run-progress-tracker-career-honesty.ts`
- `pipeline-complete-career-honesty-copy.ts`
- `RunStatusBadge.test.tsx` · `RunProgressTracker*.test.tsx` · `run-detail-workspace-derive.test.ts`

## What to build

1. Replace user-facing strings in those three modules per glossary.
2. Pipeline stopped copy: `Pipeline stopped — sealed record blocked on Simulator.` not `Career blocked on Simulator`.
3. Keep honesty behavior (Simulator cannot read as record-complete). Only the words change.
4. Update Vitest that pin the old literals.

## Acceptance criteria

`aria-label="Review status: Career blocked"` is gone. Simulator still cannot screenshot a green Record-complete chip.

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
- **Do not** rename stored tokens `"career"` / `"rehearsal"`, API/DTO field names, SQL columns, webhook JSON keys, localStorage keys, or test ids that encode those tokens. User-facing copy only.
- **Do not** use **Working**, **Production**, **Real**, **Live**, **Standard**, or **Normal** as a door label. **Working** is workspace mode; **Dev** is the environment chip; Real/Simulator/Fallback is host Mode.
- **Do not** rewrite ADR 0086 or 0091 bodies. ADR 0097 supersedes **user-facing labels only**. Honesty gates stay.
- Leftover owner: CG-031 / CG-032 / CG-033 honesty copy. **Do not re-implement that file.** Implement only *What to build*.
