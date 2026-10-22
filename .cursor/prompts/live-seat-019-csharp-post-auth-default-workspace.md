# LS-019 — C# post-auth and default-workspace ratchets

**Wave:** live-seat (**LS**). **Cluster:** ratchet. **Depends on:** LS-004, LS-009.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Architecture and application tests pin: invitation wins; default workspace exists after provision; Complete/select/accept never bind production-like hosts to `ScopeIds.DefaultWorkspace` as a customer seat.

## Why

UI can still be pointed at demo if the session JWT/workspace ids are the development defaults.

## Context

- ADR 0041 fail-closed scope
- `TrialLocalJwtScopeDefaults` (trial/demo only)
- `PostAuthBootstrapServiceTests`
- `TenantProvisioningServiceTests`
- `HttpScopeContextProviderTests`

## What to build

1. Tests named `LiveSeatLs019*` (or extend existing classes) for destination order + provision default workspace.
2. Assert accept/select session `WorkspaceId` equals invitation/membership workspace, not `ScopeIds.DefaultWorkspace`, unless the test is explicitly the development bootstrap tenant.
3. Architecture test: ADR 0102 file exists (if not already in LS-001).
4. Scoped `dotnet test` filters only; `agent-compile-check` if C# production code changed in this prompt (prefer tests-only here).

## Acceptance criteria

Scoped C# tests green. DefaultWorkspace GUID is not a silent customer fallback on production-like scope derivation.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** rename stored tokens `"career"` / `"rehearsal"`. **Do not** use **Working**, **Production**, **Real**, **Live**, **Standard**, or **Normal** as a Record/Practice door label. **Live tenant workspace** is scope language, not a review-type chip.
- **Do not** merge Training with Practice. **Do not** delete Guided. **Do not** hide **NOT LIVE DATA** honesty on a sample/demo workspace.
- **Do not** rewrite ADR 0086, 0091, 0094, or 0097 bodies. This wave adds first-login scope + training choice; Record/Practice honesty stays.
- Leftover owner: ADR 0041 tests. **Do not re-implement that file.** Implement only *What to build*.
