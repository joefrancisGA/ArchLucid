# FP-11 — 24-hour restore button sends the expected pointer token

`FindingDispositionRestoreButton.tsx` POSTs without `expectedCurrentDispositionRowVersionBase64`.

## Goal

Before restore POST:

1. `listFindingDispositions(findingId)` (or use a row version passed in as prop if inspect already has it).
2. Send FP-02 result on `recordFindingDisposition`.

On 409: do not `clearFindingDispositionRestoreSnapshot`; surface conflict (inline error or `FindingDispositionConflictPanel` if the parent can host it). Keep the button enabled after error.

Busy/disabled during the fetch+POST.

## Why

Restore is an explicit career reversal of Accept / Reject-as-not-applicable. It must not skip CAS.

## Context

- `FindingDispositionRestoreButton.tsx`
- Snapshot helpers in `finding-disposition-restore-snapshot.ts`

## What to build

1. Fetch or accept prop `currentDispositionRowVersionBase64`.
2. Attach token.
3. Vitest: mock list + record; assert body field; 409 does not clear snapshot.

## Acceptance criteria

- Restore with a pointer sends the token.
- Restore with empty history (should be rare) omits token and still attempts POST.

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
