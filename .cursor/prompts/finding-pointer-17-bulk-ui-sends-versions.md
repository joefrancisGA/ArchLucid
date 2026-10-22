# FP-17 — Findings-queue bulk actions send per-finding pointer tokens

`GovernanceFindingsBulkActions.tsx` calls `recordBulkFindingDisposition({ findingIds, disposition, rationale, ... })` with no versions (~L149).

## Goal

Collect `currentDispositionRowVersionBase64` / `latestDispositionRowVersionBase64` from the **selected rows already loaded in the queue** (do not N+1 `listFindingDispositions` unless a selected row has no version field — then fetch that finding only).

Pass `expectedCurrentDispositionRowVersionBase64ByFindingId` (or the FP-13 shape) into `recordBulkFindingDisposition`.

Rows with no pointer omit the map entry (first disposition).

Undo bulk POST (~L186) must send tokens from the **apply result** or a refetch — same rule as FP-10.

Extend FP-12 ratchet to bulk call sites if that was deferred.

## Why

Queue triage is how architects disposition many findings. Stale tabs must 409, not overwrite.

## Context

- `GovernanceFindingsBulkActions.tsx`
- Queue row types / registers bundle
- Findings list may not yet expose row version — if missing, add it to the register DTO **only if** already on inspect/history APIs; prefer mapping `CurrentDispositionRowVersionBase64` from an existing list DTO before adding columns.

## What to build

1. Plumb version from row → bulk body.
2. If list DTO lacks the field, add it on the existing findings register/list response (C# + OpenAPI) — smallest field add, no new endpoint.
3. Vitest: selected two rows with versions → map has both ids.

## Acceptance criteria

- Bulk apply sends the map.
- Findings without a pointer are in `findingIds` but not in the map.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0076 body except Related pointers. Do **not** add a new ADR. FP-22 may correct the stale PA table in `docs/library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`.
- **Do not** implement LP-19 (401 resume / idempotency replay) or LP-20. This wave only attaches the CAS token and 409 recovery.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK, LP except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- Prefer **no schema change** — `RowVersionStamp` already exists on `dbo.FindingCurrentDispositions`. SQL stays in the single DDL file per database plus a numbered migration only if a schema change is unavoidable.
