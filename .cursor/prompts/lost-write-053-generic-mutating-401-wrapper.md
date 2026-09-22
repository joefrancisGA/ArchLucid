# LW-053 — Generic 401 resume wrapper for livelihood mutating verbs

**Wave:** lost-write (**LW**). **Cluster:** 401-resume. **Depends on:** LW-007, LW-003, LW-051.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Add a single helper used by livelihood POSTs/PATCHes/PUTs: on 401, persist pending (kind + payload + idempotencyKey + returnPath), persist idle desk, redirect to session-expired. Do not add a global interceptor that captures billing or auth.

## Why

Per-kind wrappers will drift. A narrow livelihood wrapper is the 0089 execution.

## Context

- throwApiRequestError / http verb helpers (find the mutating fetch module — not http-verbs-get only)
- recordFindingDispositionWith401Resume as the first consumer to refactor toward the helper

## What to build

1. Helper `withLivelihood401Resume({ kind, payload, returnPath }, () => apiCall)`.
2. LP-19 wrappers become thin delegates.
3. Do **not** wrap GET. Do **not** wrap `/api/auth/*`.

## Acceptance criteria

- New kinds in LW-055+ call this helper, not a third copy.

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

