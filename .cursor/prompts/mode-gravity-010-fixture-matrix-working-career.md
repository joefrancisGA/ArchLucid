# MG-010 — Fixture matrix: Working+Career default

**Wave:** mode-gravity (livelihood UX wave 27) (**MG**). **Cluster:** ratchet. **Depends on:** MG-005.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Working tests default Career (CG-075). Add a short matrix doc in the wave owner file via this prompt: Working+Rehearsal, Guided+Simulator, demo.

## Why

Fixtures are a hidden mode.

## Context

- WS-22 · CG-075

## What to build

1. Test README or comment in production-desk-chrome.test.ts.
2. Defaults documented.
3. No buyer-polished true on Working.

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
