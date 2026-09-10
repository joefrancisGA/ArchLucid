# WS-11 — Working start is expert dump / resume, not Socratic daily

Do not delete the Socratic wizard. Do not rewrite ADR 0055 for Guided. Do not auto-switch Guided → Working.

## Goal

Working Alt+N / Start / architectures/new lands on **resume last architecture** or a **blank expert editor** (paste intent, upload, actors as labeled guesses). Path chooser and Socratic wizard stay on Guided and explicit `?path=guided-intake` only (ADR 0069 clause 4 leftover).

## Why

R13’s seatholder is a qualified SME absorbing a BA’s vague request. R4’s Socratic loop is for the naive requester **through** that expert. Wizard-first daily UX burns expert time.

## Context

- `resolveWorkingStartHref`
- `use-guided-intake-wizard.ts`
- PT-03 / IS-03 leftovers
- `archlucid-ui/src/lib/architecture/architecture-routes.ts`

## What to build

1. Working new-architecture primary is the draft editor / identity desk, not the Socratic stepper.
2. Offer “Guided questions” as a secondary link, not the default.
3. Vitest: Working start href never requires guided-intake query.

## Acceptance criteria

- Working Start does not open the Socratic wizard as the only path.
- Guided two-door teaching unchanged.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0080** and **Accepts 0078 / 0079**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run SY-01–100, AO-01–50, CA-01–50, FC-01–80, PC-01–13, DR-01–16, DX, or PT overlay waves except as a named leftover. Implement only *What to build*.
- **Do not** ship `/al-ui-rate` buyer-walkthrough remediations onto Working production modules (WS-07). Guided / demo / trial remain eval seats.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

