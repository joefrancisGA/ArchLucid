# AO-21 — In-flight execute is a state on the architecture, not a wait page

**Do not fork PC-08 / LK-10 / CA-46 / DA-10.** Wait chrome stays; the **locator** is the architecture.

## Goal

While execute runs, Working URL/locator is the architecture desk (or nested review **under** it). Do not unmount the desk for a full-page wait hero.

In-flight chip: status, open nested job, cancel confirm (AD-02 leftover if still missing). Rehydrate by architecture id (CA-46).

## Why

Wait-as-the-job is a pipeline. A chip on the system you own is a desk.

## Context

- PC-08 background wait
- CA-46 in-flight rehydrate
- Run execute status DTOs

## What to build

1. Working in-flight UI mounts on desk or nested review; document which; test both resume paths.
2. No `reviewDetailPath` wait-only page as the only resume.
3. Vitest: architecture desk shows in-flight when ops exist for that identity.

## Acceptance criteria

- Do not fork crash/lease (DR-06) except to show terminal state on the chip.

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
