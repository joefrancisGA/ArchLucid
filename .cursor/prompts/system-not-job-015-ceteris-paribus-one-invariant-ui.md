# SN-015 — Ceteris-paribus: one invariant override UI

**Wave:** system-not-job (livelihood UX wave 25) (**SN**). **Cluster:** desk. **Depends on:** SN-008.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Working clone/what-if flow asks for **one** invariant override (R12). Multiple overrides require confirm “envelope will not be attributable.”

## Why

Multi-change branches make Compare noise. All-day use needs discipline, not a form of 40 fields.

## Context

- R12 ceteris-paribus

## What to build

1. One-field default.
2. Confirm to add more.
3. Do not free-form rewrite the whole draft silently.

## Acceptance criteria

Done when *What to build* is true and any tests named there pass. Working vs Guided split holds unless this prompt says otherwise.

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
- **Do not** merge tables. **Do not** draft-diff Compare. Cheap envelope ADR **0092**; runner mounts in **CE**. **Do not** re-run SY/WA-10 except leftovers.
- Leftover owner: ADR 0068 / SY / WA-10 / R12 — implement only leftover. **Do not re-implement that file.** Implement only *What to build*.
