# LS-004 — Post-auth destination order: invite first

**Wave:** live-seat (**LS**). **Cluster:** kernel. **Depends on:** LS-001, LS-002.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`ResolveStatusAsync` order stays invitation-first, then membership, then create, then no-access. Document and ratchet that a pending invite never presents create-workspace as the primary path. Complete for a single membership is the live workspace, not demo.

## Why

Owner: the more normal case is an admin invited someone to a workspace. Create-workspace must stay available but not steal the invitee.

## Context

- `PostAuthBootstrapService.cs` (already calls invitation then workspace)
- `PostAuthInvitationBootstrapService.cs`
- `PostAuthWorkspaceBootstrapService.Status.cs`
- `PostAuthBootstrapDestination`
- Tests: `PostAuthBootstrapServiceTests.cs`

## What to build

1. Comments + customer-facing bootstrap lead copy (if any) that name the order: join invite → use existing workspace → create workspace → request access.
2. C# tests: pending invitation wins over `CanCreateWorkspace`; one membership → `Complete` with that workspace id; zero membership + can create → `CreateWorkspace`; zero + cannot → `NoAccess`.
3. Do not add a Training destination enum value. Training is a UI chooser after Complete (LS-006), not a bootstrap destination.
4. Do not auto-complete into Customer Intake Demo / `ScopeIds.DefaultWorkspace` on production-like hosts (ADR 0041).

## Acceptance criteria

Failing a test that Complete returns the invited or sole membership workspace is this prompt’s job. No first-session chooser UI yet.

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
- Leftover owner: `PostAuthBootstrapServiceTests.cs`. **Do not re-implement that file.** Implement only *What to build*.
