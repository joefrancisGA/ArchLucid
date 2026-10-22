# LW-013 — DraftPatchStaleUpdatedUtcGuard requires the token

**Wave:** lost-write (**LW**). **Cluster:** server-cas. **Depends on:** LW-001, LW-009.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Change `DraftPatchStaleUpdatedUtcGuard` so `forceOverwrite == false` **and** missing `expectedUpdatedUtc` throws the same conflict (or the 400 named in LW-009) instead of `return`. Matching token + equal `UpdatedUtc` still succeeds. Stale token still 409s.

## Why

This is the load-bearing fail-closed flip. Offline replay and CLI become visible collisions instead of silent LWW.

## Context

- `ArchLucid.Application/Drafts/DraftPatchStaleUpdatedUtcGuard.cs`
- `ArchLucid.Application/Drafts/Stages/DraftRequestMutateStage.cs`
- `ArchLucid.Application.Tests/Drafts/DraftPatchStaleUpdatedUtcGuardTests.cs`

## What to build

1. Remove the `if (!expectedUpdatedUtc.HasValue) return;` LWW branch.
2. Keep `forceOverwrite` as the only skip.
3. Update unit tests that currently assert omit-token succeeds.
4. Do **not** change OpenAPI in this prompt (LW-024). Do **not** change CLI (LW-023) or offline queue (LW-036).

## Acceptance criteria

- C# unit: omit token throws; stale throws; match passes; forceOverwrite passes (LW-016–019 may land with this PR if scoped — prefer this file + existing test class; split if the diff is large).
- Blank line before `if` unless first in method. One class per file. Check nulls.

Prefer one class still. If ProblemDetails mapping needs a new exception type, new file.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** re-run AS / FP / LP / WS / LK / V12-01 bodies except as a named leftover. Implement only *What to build*.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).

