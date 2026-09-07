# SY-01 — Accept ADR 0077 — architecture is already the Working locator

Do not rewrite 0077 decisions. Do not re-run AO-01. Change Status only when the locator evidence still holds.

## Goal

Mark **ADR 0077 Accepted** if `resolveWorkingStartHref` never returns a peer review URL, nested builders exist, and AO-50 still passes. If any locator invariant failed, leave Proposed and file the gap as SY-04 — do not quietly rewrite 0077.

This prompt does **not** implement desk-as-work-surface (that is SY-02 / ADR 0079).

## Why

AO shipped the URL contract. 0077 is still **Proposed**, so reviewers cannot treat “architecture is the locator” as settled. Monday-morning leftovers get argued as if the ADR never landed.

## Context

- `docs/architecture/adrs/0077-working-architecture-is-the-locator.md`
- `archlucid-ui/src/lib/architecture-object-acceptance-guard.test.ts`
- `archlucid-ui/src/lib/working-start-route.ts`

## What to build

1. Re-run the AO-50 Vitest file. If green, set 0077 **Status: Accepted** with date 2026-09-07 (or today) and a one-line evidence pointer to the guard.
2. Update `docs/architecture/adrs/README.md` row.
3. Do **not** add nested Ask/Compare routes here.

## Acceptance criteria

- ADR 0077 Status matches whether AO-50 still passes.
- 0077 decision bullets are byte-stable aside from Status / date / evidence sentence.

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

