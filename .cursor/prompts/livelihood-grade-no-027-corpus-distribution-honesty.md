# LN-027 — Insight-density distribution is corpus, not Career

**Wave:** livelihood-grade-no (livelihood UX wave 26) (**LN**). **Cluster:** honesty. **Depends on:** LN-011.

Do not implement from the wave index. Implement only *What to build*.

## Goal

In-product or help that cites engine distribution must say recorded corpus, not the customer’s estate.

## Why

28 emitting engines on corpus ≠ this architect’s estate.

## Context

- insight-density-engine-distribution.md

## What to build

1. Copy if surfaced in UI/help.
2. Do not add engines.
3. CG-074 alignment.

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
- **Do not** add a 40th engine. **Do not** turn LLM judge default-on. **Do not** implement G-REAL-06. Structural provenance (0082) stays; this wave is false-hard + extraction honesty.
- Leftover owner: ADR 0050 / 0078 / 0082 / 0085 leftovers — do not re-run LP/FC/DX bodies. **Do not re-implement that file.** Implement only *What to build*.
