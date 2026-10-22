# FP-18 — Bulk 409 shows conflict recovery (reload current)

Controller already returns 409 with `currentDisposition` (`GovernanceStickinessController.Dispositions.cs` ~L174–182). Bulk UI likely uses a generic failure string (`GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE`).

## Goal

On bulk 409:

1. `readFindingDispositionConflictDetail`.
2. Render `FindingDispositionConflictPanel` (or the same message + reload) naming the **conflicting finding**.
3. Do not claim the whole batch applied.
4. Existing atomic rollback means zero rows applied — copy must say the batch was not applied.

Reload: refresh the findings query (TanStack invalidate / existing `onApplied` / `router.refresh` used by the queue).

## Why

A 409 that looks like a generic “failed to apply bulk” trains architects to retry blindly with new idempotency keys.

## Context

- `FindingDispositionConflictPanel.tsx`
- `GovernanceFindingsBulkActions.tsx`
- `FindingDispositionServiceBulkAtomicityTests.cs`

## What to build

1. Parse 409 in bulk catch.
2. Panel + copy that the batch rolled back.
3. Vitest with mocked 409 problem details.

## Acceptance criteria

- Parseable 409 → conflict panel with winner disposition.
- Unparseable error → existing inline failure message.

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
