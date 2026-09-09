# AO-40 — Working nav hides unbound eval destinations until an architecture is open

**Do not fork PC-04 eval eviction / CA-47.** Consume AO-39 roles.

## Goal

Working sidebar: tools classified **bind** (Ask, graph, compare) are disabled or omit until last-open architecture exists, with visible reason (not `title=` only — LS-11). They do not disappear into a desktop More **tab** strip.

Admin/eval-only routes stay out of Working daily nav (PC-04).

## Why

operate-analysis daily hrefs teach tools as the product. Tools without a system are toys.

## Context

- AO-39 roles
- sidebar-nav-daily-links
- PC-04 / CA-47
- LS-11 mouse-only title ban

## What to build

1. Gate bind-tools on last-open architecture.
2. Disabled reason visible on the control or adjacent text.
3. Vitest Working vs Guided nav.

## Acceptance criteria

- Do not use native `title` for the disable reason.

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
