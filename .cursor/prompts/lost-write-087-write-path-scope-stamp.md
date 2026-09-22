# LW-087 — Optional write-path scope stamp vs current scope

**Wave:** lost-write (**LW**). **Cluster:** cross-tab. **Depends on:** LW-085, LW-013.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Livelihood mutates (at least draft PATCH and disposition) should send or check the tab’s intended `workspaceId`/`projectId`. If storage scope changed under the tab, **do not write** — 409/confirm. Prefer a client-side stamp already on BFF headers if one exists; do not add a new tenant claim (API still binds JWT tenant).

## Why

Broadcast + invalidate can race a PATCH in flight.

## Context

- `operator-scope-storage.ts`
- BFF proxy headers
- draft persist / disposition POST

## What to build

1. If a scope header already exists, document and assert it.
2. If not, client aborts mutate when `readOperatorScopeFromStorage()` !== scope captured at form mount, with copy to refresh.
3. Do **not** trust a client-sent tenantId over JWT (ADR 0037).

## Acceptance criteria

- In-flight write after scope switch does not land in the new workspace by accident.

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

