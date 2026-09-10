# SY-100 — Wave close audit: Monday morning cannot be a job list

Do not re-run SY-01–99. Evidence-only + ADR statuses.

## Goal

Write `docs/architecture/SYSTEM_DESK_ACCEPTANCE_2026-09-07.md`: evidence table (Start, Alt+R, nested tools, import ratchet, ADR 0077/0079). Residuals: Guided peer URLs, unlinked jobs, later livelihood issues. Mark wave shipped only if SY-80 is green without skips on Alt+R and nested Ask/Compare/Graph.

## Why

Without a close audit, “100 prompts” become an open bag and the problem statement returns next week.

## Context

- SY-80 guard
- ADR 0077 / 0079

## What to build

1. Acceptance markdown + link from `docs/architecture/README.md`.
2. Optional: add SY-80 to a CI Vitest path that already runs UI unit tests (do not invent a new workflow).

## Acceptance criteria

- Audit does not claim density/FC closed.
- If nested Ask is missing, wave is **not** marked shipped.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip. A desk **command bar** or nested tool route is not a More menu for those tabs.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0079** (desk is the work surface) and **Accepts ADR 0077** when the locator already shipped.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run AO-01–50, CA-01–50, DA-01–12, PC-01–13, DR-01–16, FC-01–80, or LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).

