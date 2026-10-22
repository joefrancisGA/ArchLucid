# LS-017 — Telemetry: first-session purpose and landing

**Wave:** live-seat (**LS**). **Cluster:** ops. **Depends on:** LS-007.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Record first-tenant funnel (or adjacent) events for first-session purpose chosen, bootstrap destination, and whether Home landed on sample vs dedicated scope. No PII. Do not treat this as a GTM cohort.

## Why

Without events we cannot tell silent demo landing from explicit Training.

## Context

- `FirstTenantFunnelEventNames.cs` / `first-tenant-funnel-telemetry.ts`
- Audit: `PostAuthWorkspaceCreated`, `AdminUserInvitationAccepted`

## What to build

1. Additive event names e.g. `first_session_purpose_live`, `first_session_purpose_training`, `post_auth_landed_sample_scope`, `post_auth_landed_dedicated_scope`.
2. Client emit after chooser PUT; bootstrap host emit after scope apply (sample vs not).
3. Do not log workspace names that are customer data beyond existing audit patterns; ids OK in audit, funnel stays coarse.
4. Tests for event catalog + client emit. Extend migration only if the SQL catalog check-constraint needs new names (single DDL file + numbered migration).

## Acceptance criteria

A Training choice and a live landing are distinguishable in telemetry tests. No GTM M-90 work.

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
- Leftover owner: first-tenant funnel catalog. **Do not re-implement that file.** Implement only *What to build*.
