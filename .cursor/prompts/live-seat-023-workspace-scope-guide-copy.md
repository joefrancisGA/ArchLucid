# LS-023 — Workspace scope guide and onboarding copy

**Wave:** live-seat (**LS**). **Cluster:** copy. **Depends on:** LS-003, LS-015.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Customer-facing `WORKSPACE_SCOPE_GUIDE.md` and related onboarding copy: signed-in default is your workspace; sample is Training or an explicit visit; first login asks Training vs start in my workspace; invites join a waiting workspace.

## Why

The current guide leads with Customer Intake Demo as the example label, which teaches the screenshot state.

## Context

- `docs/library/customer-facing/WORKSPACE_SCOPE_GUIDE.md`
- `OPERATOR_UI_EXPERIENCE_MODES.md` (pointer only — do not rewrite Working/Guided tables except a one-line first-session purpose)
- Help topic from LS-015 should match

## What to build

1. Rewrite the sample section: demo compact label is for Training / evaluator demo builds. Connected tenant shows the org workspace name.
2. Add first-login section: two choices; invite vs create.
3. Symptom table: NOT LIVE DATA unexpected → you are on sample; leave training / switch workspace.
4. Vitest if help markdown is generated from this file; otherwise doc-only + help parity from LS-015.
5. Do not edit GTM DEMO_QUICKSTART beyond a see-also if required for honesty.

## Acceptance criteria

A new admin can read the guide and expect invitees to land live, not in Customer Intake Demo.

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
- Leftover owner: `WORKSPACE_SCOPE_GUIDE.md`. **Do not re-implement that file.** Implement only *What to build*.
