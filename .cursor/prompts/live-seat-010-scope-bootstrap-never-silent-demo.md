# LS-010 — Scope bootstrap never silent-lands on demo

**Wave:** live-seat (**LS**). **Cluster:** chrome. **Depends on:** LS-002, LS-007.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Signed-in operators with first-session purpose `live` (or unset after they chose Start in my workspace) **replace** persisted Customer Intake Demo / dev-default sample scope with dedicated live scope. Sample visit remains explicit (`visitSampleWorkspaceScope` or Training).

## Why

This is the screenshot bug. `bootstrapDedicatedWorkspaceScope` already intends this (`shouldBootstrapDedicatedWorkspaceScope`) but still loses when dedicated candidate is null, sample visit flag is sticky, or storage already looks “set” to demo.

## Context

- LS-002 inventory (every silent writer)
- `operator-scope-bootstrap.ts`
- `OperatorWorkspaceScopeBootstrapHost.tsx`
- `isSampleWorkspaceVisitActive`
- `resolveDedicatedScopeFromRemoteBootstrap`

## What to build

1. If signed-in AND purpose is not training AND sample visit is not active: stored sample/dev-default scope is **not** a reason to skip bootstrap. Always resolve remote dedicated scope.
2. If remote dedicated scope exists, `applyDedicatedWorkspaceScope`.
3. If remote dedicated is missing, send the user to `/auth/bootstrap` (create / select / no-access) — **not** Customer Intake Demo.
4. Sample visit flag must be session-scoped and cleared on login unless purpose is training.
5. Vitest covering the existing `bootstrapDedicatedWorkspaceScope_replaces_dev_default_scope_for_signed_in_users` plus: sticky demo storage + signed-in + purpose live → dedicated; dedicated null → bootstrap route not demo.

## Acceptance criteria

A signed-in Record user with a real membership cannot screenshot Home as Customer Intake Demo unless they chose Training or Visit sample this session.

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
- Leftover owner: `operator-scope-bootstrap.ts`. **Do not re-implement that file.** Implement only *What to build*.
