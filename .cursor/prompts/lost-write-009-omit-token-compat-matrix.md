# LW-009 — Compat matrix: omit-token today vs fail-closed

**Wave:** lost-write (**LW**). **Cluster:** contract. **Depends on:** LW-001, LW-002.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Document the breaking change for API/CLI clients: after LW-013, omit-token PATCH returns 409 (or 400 — pick one in 0088 and stick to it) instead of 200 LWW. List in-repo clients and the prompt that fixes each.

## Why

Fail-closed CAS is a behavior change. Without a matrix, CLI and tests will red-fail with “unexpected 409” and someone will revert the guard.

## Context

- LW-002 inventory
- `ArchLucid.Application.Tests/Drafts/DraftPatchStaleUpdatedUtcGuardTests.cs`
- BREAKING_CHANGES.md (repo root) if that file is the product log for API breaks

## What to build

1. Add a contributor matrix (section in the LW-002 inventory or `docs/architecture/LOST_WRITE_CAS_COMPAT.md`).
2. If `BREAKING_CHANGES.md` is used for HTTP contract breaks, add a dated row — do not rewrite unrelated history.
3. State the ProblemDetails code/title the clients should handle.
4. Do **not** flip the guard yet.

## Acceptance criteria

- LW-013 can cite the status code without bikeshedding.

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

