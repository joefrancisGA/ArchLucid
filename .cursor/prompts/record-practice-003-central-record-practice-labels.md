# RP-003 — Central toggle labels: Record and Practice

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** copy. **Depends on:** RP-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Change the centralized door **names** to Record / Practice. `WORKING_CAREER_DOOR_LABEL` = `"Record"`. `WORKING_REHEARSAL_DOOR_LABEL` = `"Practice"`. Same in `WORKING_CAREER_REHEARSAL_INTENT_LABELS`. `labelForWorkingCareerRehearsalDoor("career")` returns Record. Parser still accepts stored tokens `career` / `rehearsal` and legacy visible labels.

## Why

Chooser, confirm dialogs, and help tiles already call `labelForWorkingCareerRehearsalDoor()`. One constant change is the toggle. Honesty prose is later prompts.

## Context

- `archlucid-ui/src/lib/governance/working-career-rehearsal-door-copy.ts`
- `working-career-rehearsal-intent.ts`
- `working-career-rehearsal-door.ts` (`parseWorkingCareerRehearsalDoorId`, `labelFor…`)
- `WorkingCareerRehearsalChooser.test.tsx` · `OperatorShellTopBar.test.tsx`

## What to build

1. Update the two label consts + intent labels.
2. `parseWorkingCareerRehearsalDoorId` must accept `record` / `practice` (new visible labels) **and** keep `career` / `rehearsal` (tokens + legacy). Do not treat `WORKING_CAREER_DOOR_LABEL` as the only matcher.
3. Update chooser / top-bar tests that assert the visible segmented label.
4. Do not change stored default `"career"`. Do not change query keys `career` / `rehearsal` (RP-022). Additive `?record=` / `?practice=` aliases are optional, not required.
5. Guided still hides the chooser (AS-081).

## Acceptance criteria

Top-bar segmented control shows Record | Practice. Wire value for Record remains `"career"`.

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
- Leftover owner: working-career-rehearsal-door-copy.ts / working-career-rehearsal-intent.ts. **Do not re-implement that file.** Implement only *What to build*.
