# FP-15 — `FindingDispositionService.RecordBulkAsync` forwards decoded row versions

Today it builds `FindingReviewEventRecord` list and calls `_concurrencyRepository.RecordBulkAsync(records)` (~L87–96), dropping `request.ExpectedCurrentDispositionRowVersionBase64`.

## Goal

For each request, `TryDecodeRowVersion` (already used in `RecordAsync` ~L48) and pass the bytes into the FP-14 repository signature.

Invalid base64 → 400/`ArgumentException` same as single-record path (reuse helper; do not swallow).

## Why

Facade (FP-13) puts the token on `RecordFindingDispositionRequest`; service must not drop it.

## Context

- `FindingDispositionService.cs` `RecordAsync` vs `RecordBulkAsync`
- In-memory test double `InMemoryFindingDispositionConcurrencyRepository`

## What to build

1. Forward versions.
2. Update in-memory test double signature.
3. Application test: request with expected version reaches repository mock/`It.Is`.

## Acceptance criteria

- Single-record and bulk share `TryDecodeRowVersion`.
- No second decoder.

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
