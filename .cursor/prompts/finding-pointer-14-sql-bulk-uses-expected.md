# FP-14 — `RecordBulkAsync` SQL uses per-event expected row versions

`SqlFindingDispositionConcurrencyRepository.RecordBulkAsync` currently calls `RecordInTransactionAsync(..., expectedCurrentRowVersion: null)` (~L65–69).

## Goal

Pass the expected version for each event into `RecordInTransactionAsync`.

Extend `IFindingDispositionConcurrencyRepository.RecordBulkAsync` to take expected versions alongside `FindingReviewEventRecord` (parallel `IReadOnlyList<byte[]?>` **or** a small struct). Do not add a new repository.

Same transaction / first conflict rolls back the batch (existing atomicity tests in `FindingDispositionServiceBulkAtomicityTests.cs` must stay green).

`NoOpFindingDispositionConcurrencyRepository` must compile; honesty is FP-23.

## Why

Service-layer tokens are useless if SQL ignores them.

## Context

- `SqlFindingDispositionConcurrencyRepository.cs` `RecordBulkAsync` / `RecordInTransactionAsync`
- Single-record `RecordAsync` already passes expected bytes

## What to build

1. Signature + SQL loop.
2. Persistence test: pointer exists, null expected → Conflict; matching expected → Recorded.

## Acceptance criteria

- Bulk of two findings: second has stale expected → entire batch rolled back (existing atomicity behavior).
- No `If-Match` HTTP header work (out of scope).

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
