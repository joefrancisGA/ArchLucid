# AO-29 — Compare defaults to sibling reviews of this architecture

**Do not fork CA-30 / PC-06 / DR-11.** Default scope only. Do not collapse tabs.

## Goal

Working Compare / pin-second-context: picker defaults to other reviews **of the open architecture**. Cross-architecture compare remains possible via explicit search.

PC-06 read-only delta vs last seal stays on the desk (no billable run).

## Why

Unscoped compare is a demo feature. Sibling compare is how you defend this system’s history.

## Context

- `COMPARE_TWO_REVIEWS_PATH`
- CA-30
- `ComparePinToDeskActions` (DR-11)
- PC-06 delta

## What to build

1. Default candidate list filtered by ArchitectureId.
2. Pin uses nested URLs (AO-37 can finish layout).
3. Vitest: default options are siblings.

## Acceptance criteria

- R12 billable what-if stays LS-06; this prompt does not execute a new run.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, or 0074 bodies — Related pointers only. This wave **supersedes** 0072’s Working locator and 0069’s in-flight-review-first Start clause via **ADR 0077**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run CA-01–50, DA-01–12, PC-01–13, DR-01–16, or LK except as a named leftover.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).
