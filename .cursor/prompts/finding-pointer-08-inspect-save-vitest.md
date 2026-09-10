# FP-08 — Vitest: inspect save includes the pointer token when a pointer exists

Product wiring is FP-03–07. This prompt is the regression harness if earlier prompts deferred tests.

## Goal

Extend `FindingInspectGovernanceStickinessPanel.test.tsx` (or a dedicated `use-finding-inspect-governance-stickiness-dispositions.test.ts`) so that:

1. Mock `listFindingDispositions` returns one event with `currentDispositionRowVersionBase64: "AQID"`.
2. User confirms a disposition (existing confirm dialog flow).
3. `recordFindingDisposition` was called with `expectedCurrentDispositionRowVersionBase64: "AQID"`.

Second case: mark-remediated includes the same field.

Reuse existing operate-capability / confirm-dialog test setup. Do not add Playwright.

## Why

Without a test, the next inspect refactor will drop the token the way it is missing today.

## Context

- `FindingInspectGovernanceStickinessPanel.test.tsx` already mocks `recordFindingDisposition`
- Confirm flow in `FindingInspectDispositionForm.tsx`

## What to build

1. Assertions on the mock call body.
2. If the panel test cannot reach submit without a large harness, test the hook module directly with `renderHook`.

## Acceptance criteria

- Fail the test if either inspect POST omits the field when history has a version.

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
