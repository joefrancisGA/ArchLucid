# AO-49 — Unlinked legacy reviews cannot look like a complete architecture desk

**Do not fork CA-18 / CA-19.** Inbox + job chrome honesty.

## Goal

Working jobs with null ArchitectureId: banner + cannot appear as a named architecture row. Inbox lists them as “Unlinked review” with no fake parent. Do not auto-ensure a new identity from SystemName (CA-18 conservative backfill rules).

## Why

Fake parents are worse than an inbox of orphans. Silent ensure-by-name merges two customers’ systems.

## Context

- CA-18 / CA-19
- AO-06 unlinked branch
- backfill jobs

## What to build

1. Honesty component on peer review URL and inbox column.
2. Vitest unlinked fixture.
3. No SystemName fuzzy merge.

## Acceptance criteria

- Conservative backfill remains operator/job, not on-read.

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
