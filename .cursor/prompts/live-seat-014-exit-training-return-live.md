# LS-014 — Exit Training returns to dedicated live workspace

**Wave:** live-seat (**LS**). **Cluster:** chrome. **Depends on:** LS-011.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A visible **Leave training** / **Go to my workspace** action restores dedicated live scope, Working, and Record default. Purpose updates to `live` (or stays explicit training-complete — pick `live`). Sample visit flag clears.

## Why

Training must be reversible without logging out. `returnToDedicatedWorkspaceFromSample` already exists; first-session purpose must stay consistent.

## Context

- `returnToDedicatedWorkspaceFromSample`
- Workspace mode PUT
- Top bar workspace switcher / sample badge panel

## What to build

1. Primary exit on sample Home and in the sample scope switcher panel.
2. Exit: `returnToDedicatedWorkspaceFromSample`; if dedicated missing, `/auth/bootstrap` — never stay on demo silently.
3. PUT purpose `live`, workspace mode Working.
4. Vitest: exit clears sample visit; storage matches dedicated; chooser does not reappear (purpose already explicit).

## Acceptance criteria

After Training, one click returns to a Home without NOT LIVE DATA when a dedicated workspace exists.

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
- Leftover owner: `returnToDedicatedWorkspaceFromSample`. **Do not re-implement that file.** Implement only *What to build*.
