# RP-008 — Honesty strips: recovery, DLQ, budget, quality gate

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** copy. **Depends on:** RP-003.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Ops and recovery honesty strips: not sealed Career proof → not a sealed record. Quality gate / LLM budget pills do not name Career or Rehearsal as the door; they may say Record / Practice or omit the type if they are not execute posture.

## Why

Internal DLQ already says the queue is not proof. Career in that sentence is leftover threat.

## Context

- `error-recovery-career-honesty.ts` · `error-recovery-contract-copy.ts`
- `internal/integration-events-dlq-career-honesty.ts` · `integration-events-dlq-page-copy.ts`
- `llm-budget-status-pill-career-honesty.ts`
- `agent-output-quality-gate-career-honesty.ts`

## What to build

1. DLQ: `Ops queue — not a sealed record`.
2. Recovery: does not mark a Practice run record-complete. No Career-complete.
3. Budget pill: not the Record or Practice type (if it currently says Career or Rehearsal door).
4. Quality gate: not record-complete for real-mode analysis; before sealed-record export.
5. Tests that `toLowerCase()` contain `not sealed career proof` retarget.

## Acceptance criteria

DLQ page does not contain Career. Payload field `careerComplete` unchanged (RP-022).

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
- Leftover owner: CG-094 / CG-095 / CG-096 / quality-gate honesty. **Do not re-implement that file.** Implement only *What to build*.
