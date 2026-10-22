# LS-005 — Invite-accept lands on the waiting live workspace

**Wave:** live-seat (**LS**). **Cluster:** auth. **Depends on:** LS-004.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Accept invitation issues a session scoped to the invitation’s tenant/workspace/project and redirects into that **live** workspace. The UI then applies dedicated scope (not Customer Intake Demo). Default workspace on the tenant should already exist; invite attaches the user to it (or to the workspace the admin selected).

## Why

Invite is the expected common path. If accept still writes demo scope into `archlucid_operator_scope_v1`, Record users will keep seeing NOT LIVE DATA.

## Context

- `PostAuthInvitationBootstrapService.cs` (`WorkspaceId` from invitation)
- `PostAuthBootstrapClient.tsx` accept step
- `applyDedicatedWorkspaceScope` / post-auth session redirect
- `live-api-invite-flow.spec.ts`, `live-api-private-beta-access.spec.ts`
- TB-927 invitee accept → operator first action (already a known gap — close the scope half here)

## What to build

1. After accept, persist dedicated scope from session tenant/workspace/project. Clear sample-visit flag.
2. Redirect Home (or safe return path) **in that scope**. Do not call `visitSampleWorkspaceScope`.
3. Copy: you joined {workspace name}. This is your organization’s workspace — not sample data.
4. Tests: accept writes dedicated ids; storage is not `DEV_SCOPE_WORKSPACE_ID` / Customer Intake Demo.
5. If invitation workspace is itself a demo workspace (`IsDemoWorkspace`), keep honesty (LS-013) — do not pretend it is live. Prefer admin invites target the tenant default live workspace (LS-009).

## Acceptance criteria

Invitee Home workspace label is the invited workspace name. No **NOT LIVE DATA** unless that workspace is actually demo.

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
- Leftover owner: TB-927 live invitee walk. **Do not re-implement that file.** Implement only *What to build*.
