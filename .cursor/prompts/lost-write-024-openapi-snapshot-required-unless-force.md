# LW-024 — OpenAPI describes fail-closed PATCH CAS

**Wave:** lost-write (**LW**). **Cluster:** server-cas. **Depends on:** LW-013, LW-010, LW-014.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Update OpenAPI so `expectedUpdatedUtc` / `forceOverwrite` descriptions match 0088 (token required unless forceOverwrite). Regenerating the snapshot is required if descriptions or required flags change. Follow `docs/library/API_CONTRACTS.md`.

## Why

Generated clients will keep omitting the field if the snapshot still says optional-and-ignored.

## Context

- `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`
- `docs/library/API_CONTRACTS.md`
- docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md (regenerate script)

## What to build

1. Description text is mandatory even if JSON Schema cannot express “required unless other field”.
2. Regenerate UI types if the snapshot changes (`ARCHLUCID_REGENERATE_UI_API_TYPES=1` only if the runbook says so).
3. Do **not** make `forceOverwrite` default true.

## Acceptance criteria

- Contract snapshot job is green.

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

