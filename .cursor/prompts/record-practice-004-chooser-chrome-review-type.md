# RP-004 — Chooser chrome: review type, no duplicate chip

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** chrome. **Depends on:** RP-003.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Chooser chrome matches the glossary. Aria: **Review type** (not Working execution door). Drop **door** from user-facing chooser copy (shortcut, confirm title, learn-more). Show the `StatusTag` only when the host-mode matrix cell differs from the pick (Blocked, or Practice on a live host). Do not render a second Practice/Rehearsal chip that duplicates the selected segment.

## Why

The screenshot showed Career | Rehearsal plus a second orange Rehearsal chip. That looks like the product disagrees with itself. **Door** is ADR jargon.

## Context

- `WorkingCareerRehearsalChooser.tsx`
- `working-career-rehearsal-door-copy.ts` aria / shortcut / learn-more / confirm strings
- `working-career-door-host-mode-matrix.ts` (`showStatusTag`)
- CG-020 four cells

## What to build

1. `WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL` = `"Review type"`.
2. Shortcut description: cycle Record and Practice. Confirm title: change review type during in-flight analysis? Action: Change review type / Keep current type.
3. Learn-more: `Learn about Record and Practice`.
4. `showStatusTag` false for `rehearsal-simulator` when the selected segment is already Practice. Keep the Blocked tag on `career-simulator-blocked`. Keep Practice tag on `rehearsal-real-practice` if it adds information the segment does not.
5. Optional Carbon-dense legend `This review counts as` if it does not wrap the top bar; skip if density fails.
6. Tests for duplicate-chip suppression. Guided still null.

## Acceptance criteria

Simulator clone in Practice shows one Practice segment, not Practice + Practice chip. Screen readers hear Review type.

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
- Leftover owner: CG-016 / AS-077 chooser — do not fork a second chooser. **Do not re-implement that file.** Implement only *What to build*.
