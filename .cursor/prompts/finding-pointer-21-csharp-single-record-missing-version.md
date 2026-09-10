# FP-21 — C# tests: single `RecordAsync` missing expected version after pointer exists is 409

Likely already true. This prompt is evidence + gap fill, not a new rule.

## Goal

Grep `FindingDispositionConcurrentRaceTests` and repository tests. If a test already asserts: pointer exists + null `expectedCurrentRowVersion` → Conflict, cite it in a one-file comment or the FP-24 audit later.

If missing, add it next to the race tests.

Also assert: matching version allows a second (amend) disposition.

Do not change production code unless a test reveals the SQL branch is wrong.

## Why

Inspect UI sending the token only helps if the server still fail-closes the omit case. This is the contract inspect used to trip.

## Context

- `SqlFindingDispositionConcurrencyRepository.RecordInTransactionAsync` ~L122–138
- `GovernanceStickinessController.Dispositions.cs` maps body expected version ~L93

## What to build

1. Gap-fill test or cite existing.
2. No API shape change.

## Acceptance criteria

- Documented test name that FP-24 can quote.
- Amend with correct version succeeds.

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
