# SG-011 — Inventory tool empty states that teach a review as the object

**Wave:** system-gravity (livelihood UX wave 32) (**SG**). **Cluster:** inventory. **Depends on:** SG-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Produce `docs/architecture/SYSTEM_GRAVITY_TOOL_EMPTY_STATE_INVENTORY.md`: Ask/Compare/Graph/Search empty states that say pick a review instead of work on this architecture. Shrink-only. Do not mutate copy yet (SG-016+).

## Why

Without a named leak list, nested review-detail stays the instrument.

## Context

- system-desk-48 · nested Ask/Compare/Graph clients

## What to build

1. Grep Working UI/docs for the leak class. Write `SYSTEM_GRAVITY_TOOL_EMPTY_STATE_INVENTORY.md` with path, string/call, whether AO/SY/SN already covers it, leak class.
2. Vitest that the inventory file is referenced from a shrink-only guard (list may start as documentation).
3. Do not change product copy or hrefs in this prompt.

## Acceptance criteria

Done when *What to build* is true and any tests named there pass. Working vs Guided split holds unless this prompt says otherwise. Nested review workspace tabs stay a full strip.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip when a job is open.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- **Do not** restore system-wide breadcrumbs (**TB-2090**).
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- User-facing execute labels are **Record** / **Practice** (ADR **0097**). Stored tokens stay `"career"` / `"rehearsal"`. Do not resurrect **Career blocked**.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** re-run AO-01–50, SY-01–100, SN-001–040, CE-001–040, DW-001–024, DI-001–024, or RP-001–024 bodies except as a numbered leftover. **Do not** mount a second cheap-envelope runner. **Do not** invent `GET /v1/runs/{runId}/progress`.
- Leftover owner: named in Context. **Do not re-implement that file.** Implement only *What to build*.
