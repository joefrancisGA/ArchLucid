# LW-003 — Inventory livelihood mutations with no 401 resume

**Wave:** lost-write (**LW**). **Cluster:** inventory. **Depends on:** LW-001 (can parallel LW-002).

Do not implement from the wave index. Implement only *What to build*.

## Goal

List production mutating calls that a Working architect makes in a long session and whether they use `recordFindingDispositionWith401Resume` / `recordGovernanceMutationCorrectionWith401Resume` / neither. This inventory drives LW-053–062. Do not add kinds yet.

## Why

LP-19 shipped two kinds. Bulk disposition, draft PATCH, finalize, policy packs, ITSM, shares, and approvals have no replay. Mid-session 401 drops the submit.

## Context

- `archlucid-ui/src/lib/auth/livelihood-mutation-401-resume.ts`
- `archlucid-ui/src/lib/api/governance-stickiness-api-dispositions.ts`
- `archlucid-ui/src/components/usability/GovernanceFindingsBulkActions.tsx`
- `archlucid-ui/src/hooks/use-architecture-draft-autosave-persist.ts`

## What to build

1. Add a shrink-only inventory (TS module + test, same style as `livelihood-document-guard-inventory.ts`).
2. Rows: kind id, sourceRoots, resume wrapper present? (yes/no), notes.
3. Seed rows at minimum: finding_disposition (yes), governance_mutation_correction (yes), bulk disposition (no), draft patch (no), finalize (no).
4. Do **not** change storage from sessionStorage yet (LW-051).

## Acceptance criteria

- Test fails if a listed `no` row silently gains a wrapper without updating the inventory, or if the two LP-19 yes rows disappear.

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

