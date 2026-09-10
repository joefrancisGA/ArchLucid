# AO-27 — Governance queue rows return to the parent architecture

**Do not fork** governance job chooser. Add return locator.

## Goal

Working governance findings / approval queue: each row that is architecture-scoped exposes **Open architecture** (desk) and **Open review job** (nested). Do not only deep-link a peer review URL.

`returnTo` after a disposition prefers the architecture desk when the user arrived from the desk.

## Why

Governance is a valid inbox. If it can only send you to a run, you never return to the system.

## Context

- governance findings queue / approval queue
- finding disposition (ADR 0076 409 unchanged)
- AO-26 inbox pattern

## What to build

1. Row actions: desk + nested job.
2. Vitest on href helpers.
3. Do not invent finding-comment chat.

## Acceptance criteria

- 409 conflict UI stays (DR-08).

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
