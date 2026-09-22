# RP-018 — Vitest and Playwright copy assertions

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** ratchet. **Depends on:** RP-003–RP-013.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Remaining Vitest / Playwright assertions that expect visible Career / Rehearsal / career-complete follow the glossary. Identifier tests that expect `"career"` stay.

## Why

Copy PRs go red if tests still pin Career. Leaving them pins the threat.

## Context

- `WorkingCareerRehearsalChooser.test.tsx` (should be done in RP-003/004)
- honesty strip tests · help tests · `e2e/demo-workspace-a.smoke.spec.ts`
- `first-review-guide-career-honesty.test.ts`

## What to build

1. Grep `archlucid-ui` tests for `"Career"` / `career-complete` / `Career blocked`.
2. Visible-copy expects → Record / Practice / record-complete / Sealed record blocked.
3. Keep `toBe("career")` on door ids.
4. Focused `npm test --run` on touched files. No full Playwright suite unless this file names the spec.

## Acceptance criteria

Focused Vitest green. Demo smoke spec matches `Simulator cannot read as record-complete` if it asserted the old title.

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
- **Do not** rename stored tokens `"career"` / `"rehearsal"`, API/DTO field names, SQL columns, webhook JSON keys, localStorage keys, or test ids that encode those tokens. User-facing copy only.
- **Do not** use **Working**, **Production**, **Real**, **Live**, **Standard**, or **Normal** as a door label. **Working** is workspace mode; **Dev** is the environment chip; Real/Simulator/Fallback is host Mode.
- **Do not** rewrite ADR 0086 or 0091 bodies. ADR 0097 supersedes **user-facing labels only**. Honesty gates stay.
- Leftover owner: UI tests that still expect Career as visible text. **Do not re-implement that file.** Implement only *What to build*.
