# LW-097 — Save/disposition/approve error toasts do not auto-dismiss in 4s

**Wave:** lost-write (**LW**). **Cluster:** recovery. **Depends on:** LW-040, LW-044.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`showError` / `showApiError` for livelihood **mutations** (draft save, disposition, approval, finalize, share) use sticky duration (Infinity or explicit dismiss). Do not change success toasts. Do not build a full notification drawer in this wave (out of wave).

## Why

A missed 4s toast is a silent failed save. That is the same class as omit-token LWW: the architect believes the record stuck.

## Context

- `AppToaster.tsx`
- showError helper (find in archlucid-ui/src/lib or components)

## What to build

1. Opt-in sticky for mutation failures, not all errors (network blips on GET can stay 4s).
2. closeButton already on Toaster — keep it.
3. Vitest on the helper options.

## Acceptance criteria

- A failed draft save stays until dismissed.

Do **not** add `/administration/notifications` toast history. Named leftover for a later wave.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** re-run AS / FP / LP / WS / LK / V12-01 bodies except as a named leftover. Implement only *What to build*.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).

