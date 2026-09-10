# LW-001 — ADR 0088: draft PATCH CAS is mandatory unless forceOverwrite

**Wave:** lost-write (**LW**). **Cluster:** kernel-adr. **Depends on:** none — run first.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Author `docs/architecture/adrs/0088-draft-patch-cas-mandatory.md` (Status: Proposed). Decision: `PATCH` on a `Drafting` architecture draft **must** send `expectedUpdatedUtc` that matches the current server `updatedUtc`, or send `forceOverwrite: true` with a Required durable audit. Omitting the token is **not** last-write-wins. Do not change the guard body in this prompt.

## Why

Today `DraftPatchStaleUpdatedUtcGuard` returns early when `expectedUpdatedUtc` is null. The UI online path usually sends the token; the offline queue, CLI `DraftNewCommandAdmitStage`, and any client that omits the field silently overwrite. Architects will defend this document.

## Context

- `docs/architecture/adrs/template.md`
- docs/architecture/adrs/README.md (next free number after **0087** is **0088**)
- `ArchLucid.Application/Drafts/DraftPatchStaleUpdatedUtcGuard.cs`
- `ArchLucid.Contracts/Drafts/PatchDraftRequest.cs`

## What to build

1. Write ADR 0088 with Context, numbered Decision, Trade-offs, Constraints, Expected impact (include **security** — lost-update / cross-tab overwrite), Consequences.
2. Add a row to `docs/architecture/adrs/README.md`. Proposed in this PR is OK.
3. Guard test: ADR file exists; status Proposed or Accepted; does not claim live presence; does not merge DraftRequests/Runs.
4. Do **not** change the guard, OpenAPI, or UI in this prompt (LW-013+).

## Acceptance criteria

- PR review can quote 0088 for “may this PATCH omit expectedUpdatedUtc?”
- Trade-offs name extra 409s vs silent overwrite of a colleague’s draft.
- Constraints forbid live presence, unsealing, and Simulator→Real host flip.

This wave **adds ADR 0088** (this file), **ADR 0089** (LW-007), and **ADR 0090** (LW-008). Do not reuse 0081–0087 numbers.

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

