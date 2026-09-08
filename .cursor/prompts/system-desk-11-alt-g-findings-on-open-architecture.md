# SY-11 — Alt+G on Working scopes Findings to the open architecture

Do not fork AO-28 / PC-11. Governance findings hub may remain an inbox; the shortcut must not dump tenant-wide as the default while a system is open.

## Goal

Working Alt+G: if architecture in scope → nested findings (SY-43) or governance findings with architecture query already used by AO-28. If none → architecture portfolio, not an unscoped queue as Home.

## Why

A tenant-wide findings queue is an inbox. Opening it via a letter shortcut while Payments API is open teaches the queue as the object.

## Context

- `archlucid-ui/src/lib/governance/governance-findings-architecture-scope.ts`
- `archlucid-ui/src/lib/shortcut-registry.ts`
- `archlucid-ui/src/hooks/useFindingCardShortcuts.ts`

## What to build

1. Working Alt+G resolver + Vitest.
2. Keep Alt+1–3 disposition shortcuts on the findings grid when that grid is mounted.

## Acceptance criteria

- Open architecture ⇒ findings shortcut carries architecture scope.

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

