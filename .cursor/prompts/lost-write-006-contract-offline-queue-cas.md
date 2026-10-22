# LW-006 — Contract: offline draft queue carries expectedUpdatedUtc

**Wave:** lost-write (**LW**). **Cluster:** contract. **Depends on:** LW-001, LW-002.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Write a short contributor contract (library markdown or TS module with comments + tests) that an offline-queued draft PATCH **must** include `expectedUpdatedUtc` (or an explicit conflict-on-replay marker for v1 leftovers). Replay **must not** call `patchDraftRequest` with a body that omits both token and forceOverwrite.

## Why

`enqueueArchitectureDraftOfflinePatch` stringifies `buildArchitectureDraftPatchPayload` only. `DraftPatchStaleUpdatedUtcGuard` then skips CAS. Reconnect is a silent overwrite.

## Context

- `archlucid-ui/src/lib/architecture/architecture-draft-offline-queue.ts`
- archlucid-ui/src/hooks/use-architecture-draft-autosave-persist.ts (enqueue + replayOfflineQueue)
- archlucid-ui/src/hooks/architecture-draft-autosave-shared.ts (`buildArchitectureDraftPatchPayload`)

## What to build

1. Contract states: enqueue source of token; replay 409 must not dequeue; v1 entries without token must not LWW.
2. Do **not** change enqueue/replay behavior yet (LW-036+).
3. Guard test: contract file exists and forbids omit-token replay.

## Acceptance criteria

- LW-036 implementers can quote the contract without inventing a second queue.

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

