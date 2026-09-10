# AO-50 — Acceptance: Working cannot screenshot Reviews hub as Home/Start

**Do not re-run CA-50.** New guard for ADR 0077. Optional: `architecture-object-acceptance-guard.test.ts`.

## Goal

Ship a Vitest acceptance file that fails if any of these regress:

1. `resolveWorkingStartHref` returns `/architecture/reviews/` + id.
2. Working Home primary CTA href is the reviews hub or a peer review id.
3. Working `reviewDetailPath` is documented as canonical in `architecture-routes.ts` JSDoc without “legacy/Guided.”
4. Nested builders missing.

List canonical evidence tests (AO-15, AO-13, AO-02) like `professional-core-acceptance-guard.test.ts`.

Do **not** claim issue #2–7 (insight density, dual skin, batch what-if, etc.) are closed.

## Why

Issue #1 is closed only when Monday morning cannot be a run list. Overlays will drift without a ratchet.

## Context

- `professional-core-acceptance-guard.test.ts` pattern
- CA-50
- AO-01 ADR 0077

## What to build

1. `archlucid-ui/src/lib/architecture-object-acceptance-guard.test.ts`.
2. Mark ADR 0077 Accepted if 15+13+04+06 landed; else leave Proposed and list gaps in the PR.
3. Summarize residuals: Guided peer URLs, unlinked jobs, later livelihood issues **not** in this wave.

## Acceptance criteria

- This wave does **not** add engines, BFF, or trail-gate changes.

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
