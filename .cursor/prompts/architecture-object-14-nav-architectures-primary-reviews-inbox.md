# AO-14 — Nav: Architectures is primary; Reviews is the inbox

**Do not fork CA-32.** Change weight, not hiding. **Do not** put Reviews behind a desktop **More** overflow **if it is a primary workspace tab** — this is **sidebar** IA, not review-detail tabs.

## Goal

Working sidebar: Architectures is the daily noun. Reviews remains visible as “inbox / all jobs” **below** Architectures, not as a peer filled Start.

`SIDEBAR_DAILY_HREFS` / operate-analysis must not list Compare / Ask / Evidence graph **above** Architectures as if they were the job. Those tools bind later (AO-30–31).

## Why

Sidebar daily hrefs today lead operate-analysis with Evidence graph, Ask, Search, Sponsor, Compare — evaluator destinations — while the architecture desk is a sibling collection.

## Context

- `sidebar-nav-daily-links.ts`
- nav config / i18n Architectures vs Reviews
- CA-32

## What to build

1. Working daily operate group leads with architecture portfolio path.
2. Reviews href labeled as inbox in Working (tooltip/helper).
3. Vitest on daily href order for Working vs Guided.
4. Do not collapse review-detail tabs.

## Acceptance criteria

- Guided nav may keep Reviews prominent for teaching.

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
