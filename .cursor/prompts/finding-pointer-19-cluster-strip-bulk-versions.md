# FP-19 — Root-cause cluster bulk strip sends pointer tokens

`RootCauseClusterDispositionStrip.tsx` also calls `recordBulkFindingDisposition` (~L151).

## Goal

Same map as FP-17 from the cluster’s finding ids. If the cluster model lacks row versions, fetch `listFindingDispositions` per id **only when count is small**; if that is too chatty, pass versions from the parent findings list.

409 handling: reuse FP-18 helper (extract a tiny `applyBulkDispositionWithCas` if it avoids duplication — do not invent a second bulk client).

## Why

A third bulk door will regress the moment inspect/queue are fixed.

## Context

- `RootCauseClusterDispositionStrip.tsx` + test
- FP-17 client body shape

## What to build

1. Attach map.
2. Test asserts `recordBulkFindingDisposition` received versions when fixtures include them.

## Acceptance criteria

- Cluster strip is in the FP-12/FP-01 inventory as `done` after this prompt.
- No separate SQL path.

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
