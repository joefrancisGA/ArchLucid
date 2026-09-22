# RP-010 — Simulator clone banner and matrix copy

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** copy. **Depends on:** RP-004, RP-005.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The persistent Simulator-clone banner and the four host-mode matrix details follow the glossary. No `Career execute stays blocked`.

## Why

This is the banner in the owner screenshot. It is the first paragraph a clone user reads.

## Context

- `WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_*`
- `working-career-door-host-mode-matrix-copy.ts`
- `simulator-career-honesty.ts` (`Simulator cannot read as career-complete`)

## What to build

1. Banner title: `Practice on this Simulator clone` (or keep Rehearsal only if RP-003 already maps the word; prefer Practice).
2. Banner body: host pinned to rule-based analysis; Working stays in Practice so clones without live AI keep running. This is practice, not a sample workspace and not Guided teaching. A Record review stays unavailable until live AI is ready.
3. Matrix details: Record on a live host / Practice on Simulator / Practice on a live host — not career proof.
4. `Simulator cannot read as career-complete` → `Simulator cannot read as record-complete`.
5. Ready-suppressed copy: Ready-to-finalize stays off in Practice so a screenshot cannot look like a sealed record. Switch to Record when live AI is ready.
6. Tests + Playwright string in `e2e/demo-workspace-a.smoke.spec.ts` if it pins the old banner/honesty title.

## Acceptance criteria

Screenshot of Home on a Simulator clone does not contain the word Career. Honesty still blocks Record execute.

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
- Leftover owner: CG-015 / CG-020. **Do not re-implement that file.** Implement only *What to build*.
