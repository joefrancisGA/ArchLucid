# LW-002 — Inventory every PatchDraftRequest / patchDraftRequest client

**Wave:** lost-write (**LW**). **Cluster:** inventory. **Depends on:** LW-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Publish a shrink-only inventory of every production client that PATCHes a draft: UI persist, offline replay, CLI, API tests, harness. For each row: sends `expectedUpdatedUtc`, sends `forceOverwrite`, or omits both (LWW hole).

## Why

You cannot fail-close the server (LW-013) without knowing which clients will start 409ing. CLI `DraftNewCommandAdmitStage` already constructs `PatchDraftRequest` with no token.

## Context

- `ArchLucid.Cli/Commands/DraftNewCommandAdmitStage.cs`
- `archlucid-ui/src/hooks/use-architecture-draft-autosave-persist.ts`
- `archlucid-ui/src/lib/api/draft-intake-api-crud.ts`
- `ArchLucid.Contracts/Drafts/PatchDraftRequest.cs`

## What to build

1. Add `docs/architecture/LOST_WRITE_PATCH_DRAFT_CLIENT_INVENTORY.md` (contributor-only) **or** a TS/C# inventory consumed by a test — one source of truth.
2. Classify each call site: token / forceOverwrite / omit.
3. Do **not** change omit sites yet (LW-013 / LW-023 / LW-039).
4. Vitest or C# test: inventory lists the CLI omit site and the offline replay site.

## Acceptance criteria

- A reviewer can grep the inventory for `DraftNewCommandAdmitStage` and `replayOfflineQueue`.
- Inventory growth requires a documented exception; shrink is allowed.

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

