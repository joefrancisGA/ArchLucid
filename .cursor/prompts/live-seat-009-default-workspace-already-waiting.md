# LS-009 — Default live workspace already waiting

**Wave:** live-seat (**LS**). **Cluster:** tenancy. **Depends on:** LS-005, LS-008.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Tenant provisioning continues to create a **default live workspace + project** before any user clicks around. Invite and first membership attach to that workspace unless the admin chose another. New users should not need to invent a workspace when the org already exists.

## Why

Owner: ideally a default workspace is already waiting for a new user. That is mostly true in `TenantProvisioningService`; this prompt makes the join path consume it and names gaps (tenant exists without workspace; invite missing workspace id).

## Context

- `ITenantProvisioningService` / `TenantProvisioningResult.DefaultWorkspaceId`
- Admin invite API: workspace id on invitation
- `PostAuthBootstrapWorkspaceSummary`
- Identity migration `MissingDefaultWorkspace`

## What to build

1. Ratchet: provision result always has workspace + project; already-provisioned tenants still expose a workspace link (existing throw if missing — keep fail-closed).
2. Admin invite UI defaults the workspace picker to the tenant default workspace.
3. If an invitee accepts and the workspace row is missing, customer-safe error + request access — do not fall back to Customer Intake Demo.
4. Docs one paragraph in ADR 0102 consequences or `WORKSPACE_SCOPE_GUIDE.md` (full guide copy is LS-023): new users join the waiting default workspace.
5. Tests: provision → default workspace id; invite without workspace id rejected or bound to default (pick one, document in ADR). Prefer **bind to tenant default** when the admin omitted a workspace.

## Acceptance criteria

An invited user never hits create-workspace solely because “no workspace exists” on a healthy tenant. Demo scope is not the fallback.

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
- Leftover owner: `TenantProvisioningService.cs`. **Do not re-implement that file.** Implement only *What to build*.
