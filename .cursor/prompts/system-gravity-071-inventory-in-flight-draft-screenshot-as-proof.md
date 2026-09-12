# SG-071 — Inventory in-flight draft screenshot-as-proof surfaces

**Wave:** system-gravity (livelihood UX wave 32) (**SG**). **Cluster:** inventory. **Depends on:** SG-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Produce `docs/architecture/SYSTEM_GRAVITY_DRAFT_SCREENSHOT_INVENTORY.md`: Working surfaces where an in-flight draft or unlabeled envelope can screenshot as Record-complete.

## Why

CE shipped Sketch a change + Practice default. Screenshot-as-proof can still happen on draft workspace, Architecture tab, and Ready leftovers.

## Context

- CG unlabeled Ready inventory · CE-012 envelope ≠ record-complete · simulator-career-honesty.ts

## What to build

1. Do **not** re-run CE-001–040. Implement only a named leftover call site.
2. Vitest named for the leftover. Practice default and CG honesty gates stay.
3. No draft-diff Compare. No unseal.

## Acceptance criteria

Done when *What to build* is true and any tests named there pass. Working vs Guided split holds unless this prompt says otherwise. Nested review workspace tabs stay a full strip.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip when a job is open.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- **Do not** restore system-wide breadcrumbs (**TB-2090**).
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- User-facing execute labels are **Record** / **Practice** (ADR **0097**). Stored tokens stay `"career"` / `"rehearsal"`. Do not resurrect **Career blocked**.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** re-run AO-01–50, SY-01–100, SN-001–040, CE-001–040, DW-001–024, DI-001–024, or RP-001–024 bodies except as a numbered leftover. **Do not** mount a second cheap-envelope runner. **Do not** invent `GET /v1/runs/{runId}/progress`.
- Leftover owner: named in Context. **Do not re-implement that file.** Implement only *What to build*.
