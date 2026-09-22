# LW-007 — ADR 0089: livelihood mutations resume after 401 from localStorage

**Wave:** lost-write (**LW**). **Cluster:** kernel-adr. **Depends on:** LW-001 (can parallel after 0088 number reserved).

Do not implement from the wave index. Implement only *What to build*.

## Goal

Author `docs/architecture/adrs/0089-livelihood-mutation-401-resume.md` (Status: Proposed). Decision: Working livelihood **writes** persist a pending mutation on 401, survive tab close (`localStorage`), and replay once after sign-in with the same idempotency key. Scope is mutating livelihood verbs, not GET. Do not implement the interceptor in this prompt.

## Why

LP-19 is two kinds in sessionStorage. Closing the origin tab before re-auth drops the POST. Sibling tabs cannot see the pending write. Architects will lose a disposition or draft save at the idle boundary.

## Context

- `docs/architecture/adrs/template.md`
- `archlucid-ui/src/lib/auth/livelihood-mutation-401-resume.ts`
- docs/architecture/LIVELIHOOD_PROOF_ACCEPTANCE_2026-09-08.md (LP-19 shipped, narrow)

## What to build

1. Write ADR 0089 with Trade-offs, Constraints, Expected impact (security: replay CSRF / idempotency / no GET replay).
2. README row. Proposed OK.
3. Guard: ADR exists; does not claim every apiPost including billing; forbids replaying auth bootstrap.
4. Do **not** change sessionStorage in this prompt (LW-051).

## Acceptance criteria

- Reviewer can quote 0089 for “which mutations resume after 401?”

Do not reuse ADR 0082–0088 numbers.

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

