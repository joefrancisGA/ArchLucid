# FP-05 — Inspect `submitExplicitRemediation` sends the expected pointer token

Same rule as FP-04 for the second `recordFindingDisposition` call (~L228–236).

## Goal

`submitExplicitRemediation` must send the same expected token as `submitDisposition`. Refresh the held token after reload.

Do not weaken Working apply-change attestation (LP-14). Do not skip restatement (LP-15).

## Why

Mark-remediated is a second door into the same pointer. Wiring only `submitDisposition` leaves a livelihood write unprotected.

## Context

- `use-finding-inspect-governance-stickiness-dispositions.ts` `submitExplicitRemediation`
- FP-04 pattern

## What to build

1. Attach token.
2. If a test file already covers mark-remediated, assert the body field; else FP-08 will cover both.

## Acceptance criteria

- Both inspect POSTs use the same resolver/held token.
- No duplicate helper logic — call FP-02 or the hook field from FP-03.

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
