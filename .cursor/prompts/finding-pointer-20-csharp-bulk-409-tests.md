# FP-20 — C# tests: bulk with existing pointer and null expected is 409

Depends on FP-14/15.

## Goal

Persistence or application test:

1. Record a first disposition (null expected) → success + row version.
2. `RecordBulkAsync` for that finding with `expectedCurrentRowVersion: null` → **Conflict**.
3. `RecordBulkAsync` with the matching version → **Recorded**.
4. Stale version → **Conflict**.

Do not use `ConfigureAwait(false)` in tests.

Reuse `FindingDispositionConcurrentRaceTests` / SQL integration fixture style (`FindingInspectDispositionAdr0076SqlIntegrationTests.cs`).

## Why

UI tests cannot prove the SQL loop no longer hard-codes null.

## Context

- `SqlFindingDispositionConcurrencyRepository.cs`
- `FindingDispositionServiceBulkAtomicityTests.cs`

## What to build

1. Focused test class or methods on existing fixture.
2. Scoped `dotnet test` filter in the prompt summary.

## Acceptance criteria

- Null expected after pointer exists fails closed for bulk, same as single `RecordAsync`.

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
