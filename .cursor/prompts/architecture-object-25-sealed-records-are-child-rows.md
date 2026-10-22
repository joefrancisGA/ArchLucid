# AO-25 — Sealed review records appear as children, not a separate home

**Do not fork PC-12 sealed-records index.** Index may exist; Working Home is not it.

## Goal

Latest seal + prior seals list on the architecture desk. Opening a seal opens nested review in a sealed state (tabs remain). Signed-records gallery is secondary nav, not Start.

Career export still from the job (DR-10 / PC-13) — desk provides the row, not a second export stack.

## Why

PC-12 reduced route sprawl with an index. If Home or Start opens that index, the object is still a packet pile.

## Context

- signed-records paths
- CA-29 versions lattice
- desk latest-seal

## What to build

1. Desk shows latest seal status + link nested.
2. Working Start does not go to signed-records list.
3. Vitest: sealed child row present on desk fixture.

## Acceptance criteria

- Sealed bytes immutable (0039).

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
