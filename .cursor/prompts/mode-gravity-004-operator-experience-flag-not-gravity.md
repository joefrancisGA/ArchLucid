# MG-004 — `NEXT_PUBLIC_OPERATOR_EXPERIENCE` is density, not gravity

**Wave:** mode-gravity (livelihood UX wave 27) (**MG**). **Cluster:** chrome. **Depends on:** MG-002.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Docs + any leftover UI: operator-experience=operator is engineering chrome (IDs, COGS), not Career vs Rehearsal. Working density already exists without the flag (TB-643 history).

## Why

Two “operator” meanings. Architects should never need this flag to know if work is real.

## Context

- OPERATOR_UI_EXPERIENCE_MODES.md

## What to build

1. Doc pass.
2. If UI still treats the flag as Mode, stop.
3. Do not remove the flag from local .env.development.

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
- **Do not** delete Guided. **Do not** flip host Mode. operator-experience is density, not gravity.
- Leftover owner: ADR 0080 / 0086 / 0091 leftovers — do not re-run WS/AS-076–085 bodies. **Do not re-implement that file.** Implement only *What to build*.
