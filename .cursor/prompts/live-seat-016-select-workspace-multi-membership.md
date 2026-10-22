# LS-016 — Select workspace when invited to more than one

**Wave:** live-seat (**LS**). **Cluster:** auth. **Depends on:** LS-004.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`SelectWorkspace` remains the path when the user has multiple active memberships. The picker lists **live** org workspaces. Completing a pick applies dedicated scope for that workspace. Demo/sample is not a row unless it is a real membership on a demo workspace (then honesty applies).

## Why

Flexible join: some users will be invited to more than one workspace. They must choose; they must not land on Customer Intake Demo as a fake third row.

## Context

- `PostAuthWorkspaceBootstrapService.Status.cs` (count > 1 → SelectWorkspace)
- `PostAuthBootstrapClient.tsx` select step
- `CREATE_WORKSPACE_COPY.selectWorkspaceTitle`

## What to build

1. Select step copy: choose the workspace you were invited to. Continue is disabled until a pick (TB-2005).
2. After select session: `applyDedicatedWorkspaceScope` from session ids.
3. Then first-session chooser if purpose unset (LS-006).
4. Tests: two memberships → SelectWorkspace; pick writes that workspace; no auto-demo row.

## Acceptance criteria

Multi-workspace invitee cannot continue without a pick and cannot get demo scope from this step.

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
- Leftover owner: select-workspace bootstrap step. **Do not re-implement that file.** Implement only *What to build*.
