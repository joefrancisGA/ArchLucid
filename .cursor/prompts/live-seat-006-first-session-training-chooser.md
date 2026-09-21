# LS-006 — First-session chooser: Training vs my workspace

**Wave:** live-seat (**LS**). **Cluster:** chrome. **Depends on:** LS-003.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Unambiguous first-login prompt: two visible-boundary buttons. Primary **Start in my workspace**. Secondary **Training**. No third option. Cannot continue without a choice. Shown only when first-session purpose is unset (LS-007).

## Why

Owner: if someone is logging on for the first time, they must be unambiguously asked whether they want Training. Silent demo landing is not a question.

## Context

- Copy from LS-003
- `PostAuthBootstrapClient.tsx` / `AuthFlowShell` after Complete
- `WorkspaceModeProvider` (do not auto-switch returning users)
- TB-2005: disable continue until a radio/choice is selected; or two explicit buttons with no default auto-advance
- TB-2168 visible-boundary `Button`

## What to build

1. Dialog or bootstrap step `FirstSessionPurposeChooser` mounted after post-auth Complete (and after create/select/accept session is applied).
2. Two buttons, not a toggle that defaults to Training. Keyboard: both reachable; primary is Start in my workspace.
3. Escape / overlay click does **not** pick Training. If dismiss is allowed, it must equal Start in my workspace (live default) — document that in the ADR comment. Prefer **no dismiss** until a choice.
4. Do not render on demo/static/trial eval builds that are *supposed* to be sample (inventory LS-002).
5. Vitest: both labels present; no Record/Practice segments inside this chooser; Guided/Working words optional in helper text only.

## Acceptance criteria

Screenshot of first login shows the two choices before Home. A user cannot reach Home on sample scope without clicking Training.

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
- Leftover owner: `PostAuthBootstrapClient.tsx`. **Do not re-implement that file.** Implement only *What to build*.
