# AO-39 — Inventory which of 142 routes are Working peer products

**Do not delete routes in this prompt.** Produce a classified list + guard.

## Goal

From `docs/architecture/ui_routes.md` / App Router pages, classify Working destinations:

- **Locator** (architecture desk/list)
- **Nested job** (review/draft under identity)
- **Inbox** (reviews hub, governance)
- **Tool must bind** (Ask, graph, compare, search)
- **Eval/admin** (hide or demote on Working)

Commit a machine-readable list (TS const) that AO-40–41 consume. Do not hide review tabs.

## Why

Route sprawl is issue #1’s surface area. Without an inventory, later prompts guess.

## Context

- `docs/architecture/ui_routes.md` (142 pages)
- `scripts/ci/assert_archlucid_ui_app_router_unique_paths.py`
- PC-12 palette ⊆ nav

## What to build

1. `working-route-roles.ts` (or similar) mapping pathname patterns → role.
2. Vitest: every `page.tsx` path classified (fail on unknown).
3. No UX change except comments.

## Acceptance criteria

- Marketing routes stay marketing.

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
