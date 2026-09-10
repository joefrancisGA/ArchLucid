# AO-20 — Architecture identity page is the all-day shell, not a summary card

**Do not fork CA-26.** The desk must host draft pane + job list + in-flight, not bounce to other products.

## Goal

`/architecture/architectures/{architectureId}` is the Working shell for that system: identity header, current draft (or start draft), child reviews table, in-flight chip, latest seal.

Opening a review **keeps** this identity in chrome (AO-34). The desk is not a business-card that only links out.

## Why

CA-26 added desk chrome. After spawn, 0072 still leaves the desk. All-day use requires the desk to remain the place you think.

## Context

- `ArchitectureIdentityDesk*` components
- CA-26 / CA-27 / CA-28
- nested routes AO-04/05

## What to build

1. Desk layout: header + jobs + draft entry without requiring a navigation to Reviews hub.
2. Vitest: desk fixture shows child table even when a review is in flight.
3. Do not duplicate the full findings grid on the desk — link/nested workspace is the job UI.

## Acceptance criteria

- Carbon density. No marketing hero.

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
