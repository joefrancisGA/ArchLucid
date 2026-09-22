# RP-013 — First-review guide: drop accusatory screenshot copy

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** copy. **Depends on:** RP-003.

Do not implement from the wave index. Implement only *What to build*.

## Goal

First-review and ready-suppressed copy describe capability, not a suspected bad actor. No `do not screenshot them as procurement evidence`. No `screenshots cannot borrow career proof`.

## Why

The rename fails if leftover sentences still treat the architect as someone who will launder a screenshot.

## Context

- `first-review-guide-career-honesty.ts`
- `WORKING_REHEARSAL_READY_SUPPRESSED_COPY` (if not already done in RP-010)
- sharing help that says `career honesty`

## What to build

1. Working + Record + Real execute is record-complete. Practice or Simulator reviews stay visible; they are not procurement evidence.
2. Ready-to-finalize stays off in Practice so a screenshot cannot look like a sealed record. Switch to Record when live AI is ready.
3. Sharing help: subject to sealed-record honesty rules.
4. Tests.

## Acceptance criteria

No user-facing string in those modules contains borrow, do not screenshot, or Career.

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
- Leftover owner: CG-091 / first-review-guide-career-honesty.ts. **Do not re-implement that file.** Implement only *What to build*.
