# CG-021 — Career door blocks finalize when Mode is Simulator

**Wave:** career-gravity (livelihood UX wave 24) (**CG**). **Cluster:** career-gate. **Depends on:** CG-019, CG-020.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Working Career + Simulator/Fallback **cannot** finalize. Use blocked-honesty, not Ready. Rehearsal may finalize only as rehearsal-incomplete per LP-06.

## Why

Finalize is the livelihood moment. This is the load-bearing gate.

## Context

- Authority commit · `evaluateCareerArtifactHonesty` · LP-18 strip

## What to build

1. Server reject + UI disable until door/Mode agree or user switches to Rehearsal.
2. Call existing validators; extend, do not fork FC.
3. Guided Simulator teaching unchanged.

## Acceptance criteria

Career+Simulator finalize is 4xx/disabled. No Ready CTA.

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
- **Do not** re-run AS-076–085, LP-06, FC, WS bodies except as a named leftover. **Do not** implement G-REAL-06. Career vs Rehearsal stays product chrome plus run stamp, not a host-config flip.
- Leftover owner: LP-06 / LP-18 / AS-078. **Do not re-implement that file.** Implement only *What to build*.
