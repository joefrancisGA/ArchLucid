# FP-07 — After inspect 409, the next save uses the winner’s row version

Depends on FP-06 conflict detail (includes `currentDispositionRowVersionBase64`).

## Goal

On 409:

1. Store conflict detail.
2. Set held expected token from `conflict.currentDispositionRowVersionBase64` (FP-02 precedence: conflict wins).
3. `onReload` refreshes history; helper then prefers latest history event.

The **next** Confirm uses that token. Do not auto-POST after 409 (architect must read the winner and confirm).

Do **not** implement LP-19 (do not replay the failed POST after re-auth). Same idempotency key reuse is out of scope.

## Why

If inspect keeps sending the pre-conflict (or missing) token, every retry 409s forever.

## Context

- `FindingDispositionConflictDetail.currentDispositionRowVersionBase64`
- FP-02 helper
- Keyboard sets `setExpectedRowVersion` from history fetch; inspect should also adopt conflict payload immediately so reload failure still unblocks a conscious retry after the architect has seen the winner.

## What to build

1. On 409 parse success, `setExpectedToken(conflict.currentDispositionRowVersionBase64)`.
2. Vitest: 409 body version `"WIN="` → subsequent `recordFindingDisposition` mock includes `expectedCurrentDispositionRowVersionBase64: "WIN="`.

## Acceptance criteria

- Winner version is used on the next submit without a full page navigation.
- Auto-submit on 409 is forbidden.

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
