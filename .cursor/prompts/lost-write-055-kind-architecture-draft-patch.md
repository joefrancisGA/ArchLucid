# LW-055 — 401 resume kind: architecture_draft_patch

**Wave:** lost-write (**LW**). **Cluster:** 401-resume. **Depends on:** LW-053, LW-039.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Draft persist/replay 401 stores the CAS-wrapped patch body (including expectedUpdatedUtc) and replays after sign-in. Coordinate with the offline queue: do not dequeue on 401 (LW-043).

## Why

Draft save is the other high-frequency livelihood write besides disposition.

## Context

- `use-architecture-draft-autosave-persist.ts`
- livelihood-mutation-401-resume-replay.ts exhaustive switch

## What to build

1. Add kind + payload type + replay → patchDraftRequest.
2. Exhaustive `never` default stays.
3. Vitest: 401 persist includes expectedUpdatedUtc.

## Acceptance criteria

- Draft 401 does not drop CAS fields.

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

