# FP-23 — NoOp/demo disposition repository must not look like Working CAS

`NoOpFindingDispositionConcurrencyRepository` appends without CAS. That is acceptable for Simulator/demo hosts **only if** Working SQL is the production path.

## Goal

1. XML/doc comment on the NoOp type: **not** ADR 0076 CAS; must not be registered for Working production.
2. Composition test or architecture test if one already asserts the SQL repository is registered in production host — extend it. Do not add a 40th engine.
3. Do **not** implement CAS inside NoOp (fake success would hide inspect bugs).

If a DI test already forbids NoOp in production, cite it and only add the comment.

## Why

A demo host that last-write-wins will train screenshots and eval chrome. Honesty is the mitigation (same as LP-06 Simulator career).

## Context

- `ArchLucid.Persistence/Data/Repositories/NoOpFindingDispositionConcurrencyRepository.cs`
- Host composition modules

## What to build

1. Comment + optional architecture test.
2. No production DI change unless NoOp is actually wired to Working (then fail the test and stop — do not silently swap in this prompt; report).

## Acceptance criteria

- NoOp is named as non-CAS.
- Working host registration of SQL repository is evidenced or a gap is reported without a fake fix.

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
