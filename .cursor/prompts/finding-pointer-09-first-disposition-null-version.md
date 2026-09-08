# FP-09 — First disposition (no pointer) still succeeds without an expected token

Do not require a dummy token. Do not change server first-write behavior.

## Goal

Vitest + (if missing) C# coverage:

**UI:** empty history + no inspect payload version → `recordFindingDisposition` body omits `expectedCurrentDispositionRowVersionBase64` or passes `undefined`. Submit still proceeds (confirm dialog unchanged).

**Server (if not already covered):** `RecordAsync` with `ExpectedCurrentDispositionRowVersionBase64: null` when no `FindingCurrentDispositions` row exists → **Recorded**, not 409.

Point at `SqlFindingDispositionConcurrencyRepository.RecordInTransactionAsync`: null expected is conflict **only when** `currentPointer is not null`.

## Why

Fail-closed on missing token when a pointer exists must not block the first human judgment on a finding.

## Context

- `FindingDispositionConcurrentRaceTests.cs`
- `SqlFindingDispositionConcurrencyRepository.cs` ~L122–138
- FP-02 returns `undefined` on empty input

## What to build

1. UI Vitest empty-history case.
2. C# test only if grep shows no existing first-write null-expected test — do not duplicate.

## Acceptance criteria

- Empty history inspect save does not send `""` as the token.
- First write remains possible.

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
