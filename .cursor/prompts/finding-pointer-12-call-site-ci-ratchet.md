# FP-12 — CI ratchet: `recordFindingDisposition(` call sites must mention the expected-version key

Depends on FP-04, FP-05, FP-10, FP-11 product wiring. If those are incomplete, ratchet only the files already marked `done` in FP-01 inventory and fail on new files.

## Goal

Vitest (pattern: `livelihood-document-guard-guard.ts`):

Scan `archlucid-ui/src` for `recordFindingDisposition(` in non-test, non-generated `.ts`/`.tsx`.

Each matching file must contain the string `expectedCurrentDispositionRowVersionBase64` (the helper module and the API wrapper count as the definition; call sites must include the key in the object literal or a clearly named variable passed as that property).

Allowlist:

- `governance-stickiness-api-dispositions.ts` (function definition)
- `finding-expected-current-disposition-row-version.ts` (helper)
- Generated OpenAPI files

`recordBulkFindingDisposition` is owned by FP-17–19; this ratchet may ignore bulk until those land, then FP-17 extends the scan.

## Why

Inspect lost the token once. A ratchet is cheaper than another twenty-prompt wave.

## Context

- FP-01 inventory
- `findSurfaceMarkerViolations` / livelihood guard tests

## What to build

1. `finding-pointer-cas-call-site-guard.ts` + `.test.ts`.
2. Wire into an existing Vitest file or `npm run test -- --run` path documented in FP-24.

## Acceptance criteria

- Adding a new `recordFindingDisposition(` call without the key fails CI.
- Keyboard apply, inspect submits, undo, restore pass.

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
