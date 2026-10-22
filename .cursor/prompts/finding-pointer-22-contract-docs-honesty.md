# FP-22 — Concurrent-disposition contract docs match ADR 0076 client requirements

`docs/library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md` still has a PA table that says both racing HTTP calls succeed and current = latest `OccurredAtUtc` (V1 TB-986). Working text at the top already says 409 + CAS. The stale table will keep agents wiring last-write-wins.

## Goal

1. Rewrite the **Racing approve + reject** / PA answer rows so Working = CAS 409; loser reloads winner; history remains append-only.
2. Add an **Engineering surfaces** row: inspect save, keyboard apply/undo, restore, bulk, cluster strip, ITSM inbound all send `ExpectedCurrentDispositionRowVersionBase64` when a pointer exists.
3. Point too-strong vs safe: “omitting the token on inspect is a client bug, not last-write-wins.”
4. Related pointer on ADR 0076 only — **do not rewrite the ADR body**.
5. One-line pointer from `docs/library/API_CONTRACTS.md` governance dispositions row if that table exists.

## Why

Agents and humans still read the PA table. It currently describes the superseded V1 behavior.

## Context

- `FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md` L39–47 vs L12–14
- ADR 0076 file under `docs/architecture/adrs/`

## What to build

1. Doc edits only.
2. Keep V1 historical section clearly labeled superseded.

## Acceptance criteria

- No remaining unscoped sentence that racing UI dispositions both return 200 on Working.
- Client token requirement is explicit.

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
