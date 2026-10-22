# LW-085 — Broadcast operator scope changes across tabs

**Wave:** lost-write (**LW**). **Cluster:** cross-tab. **Depends on:** LW-078.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT` is a same-tab CustomEvent. Add storage event or BroadcastChannel so sibling tabs refresh scope. Do not auto-write dirty forms into the new scope (LW-078 prompts first on the originating tab).

## Why

Writes already read shared localStorage; UI can still show the old workspace. That is a wrong-desk write.

## Context

- `operator-scope-storage.ts`

## What to build

1. Cross-tab signal. Listeners already using the CustomEvent should also listen to the broadcast (thin adapter).
2. Vitest.

## Acceptance criteria

- Second tab header/scope matches storage after a switch.

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

