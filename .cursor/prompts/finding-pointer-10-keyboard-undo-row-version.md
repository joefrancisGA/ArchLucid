# FP-10 — Keyboard undo sends the expected pointer token

Keyboard **apply** already sends `expectedCurrentDispositionRowVersionBase64: expectedRowVersion ?? undefined` (~L351). The **undo** POST (~L378–387) does not.

## Goal

The undo `recordFindingDisposition` (Deferred + revisit window) must send the expected token from:

1. The apply response’s `currentDispositionRowVersionBase64` if `recordFindingDisposition` returns it, else
2. Re-read via FP-02 after apply, else
3. Held `expectedRowVersion` updated from the apply result.

409 on undo must use the same `FindingDispositionConflictPanel` path as apply.

Optionally refactor apply to FP-02 (if not done in FP-02).

Do not lengthen the 300s undo window. Do not change undo target (Deferred).

## Why

Undo is a second CAS write. A teammate who dispositioned in the 300s window must 409, not last-write-win.

## Context

- `FindingKeyboardTriageHost.tsx` apply ~L345–354, undo ~L377–387
- `ReversibleMutationSuccessCallout` 300s

## What to build

1. Capture new row version from apply result DTO.
2. Pass it on undo.
3. Vitest: apply mock returns `{ currentDispositionRowVersionBase64: "BBB=" }` → undo body includes `BBB=`.

## Acceptance criteria

- Apply still sends the pre-apply token; undo sends the post-apply token.
- Missing apply version → undo may refetch history once (same as apply pending fetch).

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
