# LS-015 — Help: first login, Training, live workspace

**Wave:** live-seat (**LS**). **Cluster:** copy. **Depends on:** LS-003, LS-006.

Do not implement from the wave index. Implement only *What to build*.

## Goal

In-app help explains first login, Training vs your workspace, and that Record/Practice is a different control. Keep help slug aliases. Do not teach silent demo landing.

## Why

Support will get “I clicked Record but it says not live data.” Help must say: check the workspace label, not only the review type.

## Context

- `/help` topics: getting-started, career-rehearsal-doors (aliases), workspace scope
- `docs/library/customer-facing/WORKSPACE_SCOPE_GUIDE.md` (full rewrite is LS-023; this prompt is in-app help)
- Help search aliases

## What to build

1. New or extended help topic e.g. `/help/first-login-workspace` (slug stable). H1: Your workspace after sign-in.
2. Sections: invited users join the waiting workspace; create only if you have no membership; first-time Training question; Record vs Practice vs Training.
3. Search aliases: training mode, not live data, customer intake demo, first login, live data.
4. Do not change career-rehearsal-doors H1 (already Record / Practice).
5. Vitest help registry + search aliases.

## Acceptance criteria

Help search for “training mode” and “not live data” hits this topic. No Career in new copy.

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
- Leftover owner: RP-011 help topics. **Do not re-implement that file.** Implement only *What to build*.
