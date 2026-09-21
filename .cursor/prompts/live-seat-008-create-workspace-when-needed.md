# LS-008 — Create-workspace prompt when no membership

**Wave:** live-seat (**LS**). **Cluster:** auth. **Depends on:** LS-004.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When bootstrap destination is `CreateWorkspace`, the user is prompted to create a workspace. The created workspace is **live and empty**. `includeDemoSeed` stays default **false**. Creating is not Training.

## Why

Owner: if the user needs to create a workspace when they log in, they should be prompted. Self-serve owners are the flexible path; invitees should not see this (LS-004).

## Context

- `CreateWorkspaceForm.tsx`, `CREATE_WORKSPACE_COPY`
- `PostAuthCreateWorkspaceRequest.IncludeDemoSeed`
- `PostAuthWorkspaceBootstrapService.Create.cs`
- Duplicate-org / no-access already exist — keep

## What to build

1. Lead copy: create a workspace for your organization. This is live data, not a sample. If you were invited, go back and accept the invitation instead (link to invite step when pending invitations exist — should not happen if LS-004 holds).
2. Keep `includeDemoSeed` checkbox **unchecked** by default. Relabel helper: optional sample reviews inside *this* tenant — not a substitute for Training chooser. Or hide the checkbox and rely on Training (preferred if product copy is cleaner; if hidden, keep the API field default false).
3. Submit still provisions tenant default workspace + project when that is the create path; then first-session chooser (LS-006).
4. Tests: default body `includeDemoSeed: false`; destination CreateWorkspace shows the form; invite pending does not.

## Acceptance criteria

No-membership self-serve user sees create-workspace, not silent demo Home. Created scope is not Customer Intake Demo.

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
- Leftover owner: `CreateWorkspaceForm.tsx`. **Do not re-implement that file.** Implement only *What to build*.
