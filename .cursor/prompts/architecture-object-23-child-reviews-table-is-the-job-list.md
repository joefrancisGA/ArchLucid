# AO-23 — Child reviews table is the Working job list (not a teaser)

**Do not fork CA-27.** Make the table the place you resume jobs.

## Goal

Identity desk child reviews table: status, started, sealed, in-flight, open nested job. Pagination honesty (CA-39 N of M). Empty = “No reviews yet” + Start review verb, not pending-finalize theater.

Do not tell the architect to “see all in Reviews hub” as the primary way to find jobs of **this** system.

## Why

If the complete job history lives only on `/architecture/reviews`, the hub stays Monday morning.

## Context

- `ArchitectureIdentityDeskReviewsTable.tsx`
- CA-27 / CA-39
- DR-11 pin column if present

## What to build

1. Table rows link nested review paths.
2. Showing N of M. Hidden filters honesty (CA-40) if filtered.
3. Vitest: primary row href nested; hub link is secondary.

## Acceptance criteria

- Full tab strip when a row opens the job (AO-33).

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
