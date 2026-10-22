# LW-076 — In-app guard intercepts router.push / replace

**Wave:** lost-write (**LW**). **Cluster:** dirty-guard. **Depends on:** LW-072.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`useInAppNavigationGuard` currently captures `a[href]` and popstate. Programmatic `router.push` (command palette, post-save redirects that are accidental, scope switch) bypasses. Patch the guard to wrap or listen for Next App Router transitions when `when` is true — without breaking allowNavigationRef for confirmed leave.

## Why

This is the remaining hole after Link interception.

## Context

- `use-in-app-navigation-guard.ts`

## What to build

1. Intercept internal programmatic navigations when dirty.
2. Do not block same-document query updates used by the guard’s own `navGuardOpen` URL sync.
3. Vitest (LW-079).

## Acceptance criteria

- router.push to another operator route prompts.

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

