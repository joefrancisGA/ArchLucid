# LS-003 — Glossary: Training vs Start in my workspace

**Wave:** live-seat (**LS**). **Cluster:** copy. **Depends on:** LS-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Central copy module for first-session purpose labels. User-facing: **Start in my workspace** (primary) and **Training** (secondary). Supporting one-liners say what each does. Do not put Training on the Record/Practice chooser.

## Why

Without a glossary, later prompts will call this Guided, Practice, demo, or Live — all of which collide with existing chrome.

## Context

- Index glossary table
- `working-career-rehearsal-door-copy.ts` (Record / Practice — do not edit except to **not** add Training)
- `workspace-mode.ts` (Working / Guided)
- Buyer polish: `BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL`

## What to build

1. New copy module e.g. `archlucid-ui/src/lib/auth/first-session-purpose-copy.ts`.
2. Primary CTA: `Start in my workspace`. Body: this is your organization’s workspace. Reviews you start here use your live data.
3. Secondary CTA: `Training`. Body: learn ArchLucid with sample data. This is not your tenant and is not a live architecture review.
4. Chooser title: `How do you want to start?` (sentence case). Do not use Live, Real, Production, Career, or Practice as the Training label.
5. Vitest: Training copy never equals Practice / Record strings; Start in my workspace never says sample/demo.
6. Do not mount the chooser yet (LS-006).

## Acceptance criteria

Copy review can quote the two buttons without reading ADR 0102. Record/Practice strings unchanged.

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
- Leftover owner: RP-003 central labels. **Do not re-implement that file.** Implement only *What to build*.
