# LS-024 — Wave close audit — live seat after login

**Wave:** live-seat (**LS**). **Cluster:** close. **Depends on:** LS-001–LS-023.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Write `docs/architecture/LIVE_SEAT_ACCEPTANCE_2026-09-20.md` against the done test in `LIVE_SEAT_COMPOSER_PROMPTS.md`. List leftovers. Do not start a new wave in this prompt.

## Why

Prompt sets rot unless someone checks the screenshot bug against the landed code.

## Context

- Done test in `docs/architecture/LIVE_SEAT_COMPOSER_PROMPTS.md`
- Owner screenshot: Record + Customer Intake Demo + NOT LIVE DATA
- Index owner questions — record which were confirmed

## What to build

1. Acceptance doc: six done-test rows pass/fail with evidence (test names, not vibes).
2. Confirm ADR 0102 Proposed or Accepted.
3. Residual: any silent demo writer from LS-002 still open.
4. Explicit: Training still not a Record/Practice segment; Guided still exists; sample honesty still on; host Mode still Simulator.
5. No additional product features.

## Acceptance criteria

A reviewer can decide whether to close the wave using only the acceptance doc.

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
- Leftover owner: `RECORD_PRACTICE_ACCEPTANCE_2026-09-12.md` pattern. **Do not re-implement that file.** Implement only *What to build*.
