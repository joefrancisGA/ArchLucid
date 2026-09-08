# FP-16 — OpenAPI snapshot + generated TS types for bulk expected versions

Depends on FP-13 DTO.

## Goal

Regenerate OpenAPI v1 snapshot and UI types so `recordBulkFindingDisposition` body includes the map/list from FP-13.

Follow `docs/library/API_CONTRACTS.md` / `docs/library/OPENAPI_CONTRACT_DRIFT.md`. From repo root, the usual path is `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh` **only if** this prompt’s DTO change requires it. Do not hand-edit `*.generated.ts`.

Update `governance-stickiness-api-dispositions.ts` `recordBulkFindingDisposition` body type to include the field.

## Why

UI cannot send a field the snapshot does not know without drifting the buyer contract.

## Context

- `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`
- `archlucid-ui/src/lib/api-types.generated.ts` / `packages/api-types`

## What to build

1. Snapshot + generated types.
2. TS client body type.
3. No behavior change beyond types if UI is FP-17.

## Acceptance criteria

- CI OpenAPI snapshot job would pass for the new field.
- `recordBulkFindingDisposition` TypeScript body accepts the map.

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
