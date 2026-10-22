# LS-012 — Empty live Home: start work, not Open sample

**Wave:** live-seat (**LS**). **Cluster:** copy. **Depends on:** LS-010.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Empty Home on a **live** workspace uses a work primary CTA (**New review** / start first review). **Open sample review** is not primary. Optional secondary: try a training walkthrough (enters Training / sample visit). Demo-seeded overview may keep sample primary.

## Why

Owner screenshot: Record + demo Home still pushes Open sample review / Start first review on sample data. Live empty is a real empty tenant, not a broken demo.

## Context

- `resolve-empty-home-do-this-next.ts` (Working already prefers New review; demoSeededOverview prefers sample)
- `OperatorHomeCompletedSampleAction`
- Home banners for sample scope
- Index question 4: secondary sample OK

## What to build

1. Live dedicated scope + empty reviews: `kind: "work"` primary. Secondary outline/link **Try a training walkthrough** that calls the Training path (LS-011) or sample visit — not a second primary.
2. Do not show **NOT LIVE DATA** on live empty Home. Zero reviews is not demo.
3. Keep sample primary only when `demoSeededOverview` / sample visit / purpose training.
4. Vitest for `resolveEmptyHomeDoThisNext`: workingMode live empty → work; demoSeeded → sample; training purpose → sample allowed.

## Acceptance criteria

Live empty Home screenshot has no orange NOT LIVE DATA and no primary Open sample review.

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
- Leftover owner: `resolve-empty-home-do-this-next.ts`. **Do not re-implement that file.** Implement only *What to build*.
