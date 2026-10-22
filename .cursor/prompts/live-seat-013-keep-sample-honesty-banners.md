# LS-013 — Keep NOT LIVE DATA on sample even in Record

**Wave:** live-seat (**LS**). **Cluster:** honesty. **Depends on:** LS-010.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Honesty banners on sample/demo scope stay. Record selected + Customer Intake Demo still says this is not live tenant data. This prompt is a **keep ratchet**, not a copy rewrite unless strings contradict ADR 0102.

## Why

The tempting “fix” for the owner screenshot is to hide the orange banner because Record is on. That would let a screenshot look like a live tenant review on sample data.

## Context

- Home sample banners, `DEMO — NOT LIVE`, `TrialAiBudgetStatusBanner`, `SponsorDashboardSampleWorkspaceBanner`
- CG-015 simulator clone banner (different — not sample workspace)
- Record/Practice honesty (RP) stays

## What to build

1. Vitest/Playwright: sample scope + Working + Record still exposes NOT LIVE DATA / not-your-tenant copy.
2. Do not gate those banners on review type.
3. Optional copy tweak: “Record is for live tenant reviews. Switch to your workspace or stay in Training.” Link uses dedicated return (LS-014). Do not mention Career.
4. Inventory leftover strings that say Record makes sample data live — delete those.

## Acceptance criteria

A Training or explicit sample visit can still screenshot the honesty the owner saw. Live-purpose Home cannot.

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
- Leftover owner: sample workspace banners. **Do not re-implement that file.** Implement only *What to build*.
