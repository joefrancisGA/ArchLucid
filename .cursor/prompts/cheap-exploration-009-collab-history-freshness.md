# CE-009 — Collab history freshness leftover (AD-06)

**Wave:** cheap-exploration (livelihood UX wave 29) (**CE**). **Cluster:** collab. **Depends on:** AD-06.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Recent-actor strip as-of/refresh on inspect/desk if AD-06 leftover. Not live viewers.

## Why

Stale “who touched this” looks like presence.

## Context

- CollabRecentActorPresenceStrip · TB-2248

## What to build

1. Freshness as-of.
2. Refresh control.
3. No heartbeats.

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
- **Do not** draft-diff. **Do not** finding-comment chat. **Do not** live presence. Sketches default Rehearsal. Parent seal immutable.
- Leftover owner: ADR 0092 / R12 / WA-10 leftovers — no draft-diff, no chat, no presence. **Do not re-implement that file.** Implement only *What to build*.
