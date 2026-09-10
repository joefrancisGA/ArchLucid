# SY-80 — System-desk acceptance guard (stronger than AO-50)

Do not re-run AO-50. New file `system-desk-acceptance-guard.test.ts` that **includes** AO-50 invariants plus SY contract.

## Goal

Fails if:

1. Working Start is a peer review URL (AO-50).
2. Working Alt+R is reviews hub (SY-07/78).
3. Nested Ask/Compare/Graph helpers missing (after those PRs land — use inventory flags so early PRs can ship the file with `it.skip` only if necessary; prefer always-on after SY-36).
4. Working Home primary imports `reviewDetailPath`.
5. ADR 0079 file exists.

Do **not** claim FC, density, what-if, or dual-skin closed.

## Why

Issue “job vs system” is closed only when Monday muscle memory cannot open a job list as Home.

## Context

- `architecture-object-acceptance-guard.test.ts`
- `professional-core-acceptance-guard.test.ts` pattern

## What to build

1. `archlucid-ui/src/lib/system-desk-acceptance-guard.test.ts`
2. Inventory of evidence files like AO-50.
3. `docs/architecture/SYSTEM_DESK_ACCEPTANCE_2026-09-07.md` stub updated by SY-100.

## Acceptance criteria

- Guard is the wave ratchet. Later overlays that restore Alt+R → hub fail CI.

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

