# RP-002 — Inventory user-facing Career / Rehearsal copy

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** inventory. **Depends on:** RP-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Write `docs/architecture/RECORD_PRACTICE_USER_COPY_INVENTORY.md`. List every **user-visible** string containing Career / career / Rehearsal that is not an ADR filename, prompt-family name, or stored token. Group by surface. Mark blocked-state strings P0.

## Why

The door label is centralized; honesty prose is scattered across ~25 modules. Without an inventory, later prompts miss a threatening leftover.

## Context

- `archlucid-ui/src/lib/governance/working-career-rehearsal-door-copy.ts`
- `working-career-door-gate-copy.ts` · `*-career-honesty.ts` modules
- Help: `career-rehearsal-doors`, `career-vs-rehearsal`
- CLI help (AS-083) · `docs/go-to-market/CAREER_VS_REHEARSAL_WORKING_DOORS.md`

## What to build

1. Inventory markdown: path, exported symbol, exact string, P0/P1/P2, whether it is toggle / adjective / blocked / help / CLI.
2. Separate table: **must not change** — `"career"` / `"rehearsal"` tokens, `WorkingCareerRehearsalDoor` fields, `career-real` cell ids, webhook `careerComplete`, help slugs (keep as aliases).
3. Do not mutate copy in this prompt.

## Acceptance criteria

A later prompt can pick a P0 row without grepping the repo from scratch.

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
- Leftover owner: CG-002–CG-009 inventories — do not rewrite those gravity inventories. **Do not re-implement that file.** Implement only *What to build*.
