# FP-04 — Inspect `submitDisposition` sends the expected pointer token

Do not mount the 409 panel (FP-06). Do not change mark-remediated (FP-05).

## Goal

In `use-finding-inspect-governance-stickiness-dispositions.ts`, the `recordFindingDisposition` call inside `submitDisposition` (~L176–193) must include:

`expectedCurrentDispositionRowVersionBase64: resolveExpectedCurrentDispositionRowVersion(...)`  
(or the hook’s held token; omit the key / pass `undefined` when no pointer).

Do **not** mint a new meaning for missing token: first disposition stays allowed.

Keep rationale, trade-off, restatement, apply-change attestation fields unchanged (LP-14/15).

## Why

This is the career write: composed rationale on inspect. Keyboard triage already sends the token at `FindingKeyboardTriageHost.tsx` ~L351.

## Context

- `use-finding-inspect-governance-stickiness-dispositions.ts` `submitDisposition`
- `recordFindingDisposition` body in `governance-stickiness-api-dispositions.ts`
- FP-02 / FP-03

## What to build

1. Attach the token on the existing POST.
2. After successful save + `reload()`, refresh the held token from the new history (response DTO also has `currentDispositionRowVersionBase64`).
3. Unit/Vitest can wait for FP-08 if this file has no harness; then add a focused assertion here if a test already mocks `recordFindingDisposition`.

## Acceptance criteria

- When hook token is `"AQID"`, the POST body includes `expectedCurrentDispositionRowVersionBase64: "AQID"`.
- When token is null, the key is omitted or undefined — not `""`.

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
