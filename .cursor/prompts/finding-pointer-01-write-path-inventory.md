# FP-01 — Inventory every write that can move the current disposition pointer

Do not change runtime behavior. Do not rewrite ADR 0076.

## Goal

Publish an inventory of production call sites that can insert a finding disposition event and/or update `dbo.FindingCurrentDispositions`. Each row: path, whether it currently sends `expectedCurrentDispositionRowVersionBase64` / `ExpectedCurrentDispositionRowVersionBase64`, and which later FP prompt owns the leftover.

Land:

1. `archlucid-ui/src/lib/findings/finding-pointer-cas-inventory.ts` (UI call sites + required marker `expectedCurrentDispositionRowVersionBase64`).
2. A matching C# comment or test-only list is **not** required this prompt if the TS inventory covers UI; name SQL/service bulk rows in the inventory as `sourceRoots` pointing at:
   - `use-finding-inspect-governance-stickiness-dispositions.ts` (`submitDisposition`, `submitExplicitRemediation`)
   - `FindingKeyboardTriageHost.tsx` (apply vs undo)
   - `FindingDispositionRestoreButton.tsx`
   - `governance-stickiness-api-dispositions.ts` (`recordFindingDisposition`, `recordBulkFindingDisposition`)
   - `GovernanceFindingsBulkActions.tsx`
   - `RootCauseClusterDispositionStrip.tsx`
   - `SqlFindingDispositionConcurrencyRepository.RecordBulkAsync`
   - `FindingDispositionService.RecordBulkAsync`
   - `GovernanceStickinessFacade.Findings.Dispositions` bulk mapper
   - `ItsmInboundDispositionSync.cs` (already sends — mark **done**, owner LP-17)

Vitest: inventory file exists; listed UI sourceRoots exist on disk.

## Why

Keyboard triage already sends the token. Inspect, undo, restore, and bulk do not. Without a listed inventory, later prompts will miss a door.

## Context

- ADR 0076 / `docs/library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`
- `recordFindingDisposition` in `archlucid-ui/src/lib/api/governance-stickiness-api-dispositions.ts`
- Pattern: `livelihood-document-guard-inventory.ts` (shrink-only lists)

## What to build

1. Grep `recordFindingDisposition(`, `recordBulkFindingDisposition(`, `RecordBulkAsync`, `ExpectedCurrentDispositionRowVersionBase64`.
2. Write the inventory module with `done` vs `fpOwned` vs `deferred` (deferred must be empty unless a named exception).
3. One Vitest that every `sourceRoot` path exists.

## Acceptance criteria

- Inspect submit, inspect mark-remediated, keyboard apply, keyboard undo, restore, bulk UI, cluster strip, SQL bulk, service bulk, facade bulk, and ITSM inbound each have a row.
- Keyboard apply and ITSM inbound are marked already sending the token.
- No production behavior change.

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
