# LS-011 — Training maps to Guided + sample visit

**Wave:** live-seat (**LS**). **Cluster:** chrome. **Depends on:** LS-006, LS-010.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Choosing **Training** sets workspace mode to **Guided** and starts an explicit sample-workspace visit (Customer Intake Demo / pinned sample). Choosing **Start in my workspace** sets **Working**, **Record**, and dedicated live scope. Do not move the Record/Practice chooser.

## Why

Training needs a real teaching surface. Reusing Guided + sample visit avoids a fourth chrome mode. Practice stays available later on the live workspace as a dry-run review type.

## Context

- `PUT /v1/user/preferences/workspace-mode`
- `visitSampleWorkspaceScope` / `markSampleWorkspaceVisitActive`
- `WorkingCareerRehearsalChooser` (Guided returns null — keep)
- Assumed index question 1 (Guided + sample). If owner picks Alternative A/B, stop and update ADR 0102 before coding.

## What to build

1. Training click: PUT purpose `training`, PUT workspace mode Guided, `visitSampleWorkspaceScope`, navigate Home.
2. Start in my workspace click: PUT purpose `live`, PUT workspace mode Working, apply dedicated scope, Record door (existing AS-080 default — do not PUT unless you must set explicit career).
3. Do not PUT Practice/rehearsal as a side effect of Training.
4. Vitest: Training calls visit-sample; live purpose never calls it. Guided tests still must not require the Record chooser.

## Acceptance criteria

Training Home may show NOT LIVE DATA (honest). Live-purpose Home must not. Record/Practice tokens unchanged.

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
- Leftover owner: `visitSampleWorkspaceScope`. **Do not re-implement that file.** Implement only *What to build*.
