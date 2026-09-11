# LW-089 — SQL architecture draft work leases (unified DDL + migration)

**Wave:** lost-write (**LW**). **Cluster:** work-lease. **Depends on:** LW-008.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Add `dbo.ArchitectureWorkLeases` (or equivalent) in `ArchLucid.sql` **and** a numbered migration after 380 (381+). Columns: tenant, architecture/draft id, holder user id, acquired/heartbeat/expires, rowversion. No SQL RLS. Rollback script. Architecture tests for DDL like AS-087.

## Why

Lease without SQL is a cookie. Two desks need a server token.

## Context

- `ArchLucid.Persistence/Scripts/ArchLucid.sql`
- ArchLucid.Persistence/Migrations/380_ArchitectureShares.sql (pattern)
- ADR 0090

## What to build

1. Unified DDL + `381_…sql` + `Rollback/R381_…sql`.
2. FK to draft/architecture and tenant catalog. Index for expiry sweep.
3. Do **not** add presence/cursor tables.
4. Architecture.Tests DDL grep: no RLS.

## Acceptance criteria

- DbUp migration is the only schema path.

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

