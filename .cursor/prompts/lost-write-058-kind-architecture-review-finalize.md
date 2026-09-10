# LW-058 — 401 resume kind: architecture_review_finalize

**Wave:** lost-write (**LW**). **Cluster:** 401-resume. **Depends on:** LW-053.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Finalize/commit is permanent (registry). 401 resume is still required so the architect does not think finalize failed and click twice **without** idempotency. Replay **must** use the same idempotency key. If the server already finalized, replay is a safe replay, not a second seal.

## Why

Double-finalize is worse than a lost click. Idempotency is the safety.

## Context

- `CommitRunButton.tsx`
- mutation-reversibility-registry.ts governance_architecture_review_finalize

## What to build

1. Persist pending finalize with idempotencyKey.
2. Document: if requestLeftClient and server succeeded, replay returns the sealed record, does not unseal.
3. Do **not** make finalize reversible.

## Acceptance criteria

- One seal. Resume does not create a second sealed record.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** re-run AS / FP / LP / WS / LK / V12-01 bodies except as a named leftover. Implement only *What to build*.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).

