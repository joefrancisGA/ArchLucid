# LW-014 — ProblemDetails distinguish omit-token vs stale token

**Wave:** lost-write (**LW**). **Cluster:** server-cas. **Depends on:** LW-013.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Map omit-token and stale-token to stable ProblemDetails `code`/`title`/`detail` the UI can branch on (Keep mine vs “this tab never had a version”). Do not invent a second conflict panel.

## Why

The desk already has Keep mine / Keep server for stale. Omit-token after 0088 is a client bug or v1 queue leftover — copy must not say “another session” if this tab never sent a token.

## Context

- Existing draft 409 mapping (search ConflictException draft)
- archlucid-ui/src/hooks/use-architecture-draft-autosave-persist.ts (setConflictMessage)
- `docs/library/API_CONTRACTS.md`

## What to build

1. Stable codes, e.g. `draft_cas_token_missing` vs `draft_cas_stale`.
2. UI copy helper can land here **or** in LW-034 — do not fork two helpers.
3. Focused C# + Vitest on the codes.

## Acceptance criteria

- Working desk can tell omit from stale without reading exception strings.

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

