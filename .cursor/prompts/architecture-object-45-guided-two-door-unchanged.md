# AO-45 — Guided two-door teaching remains; Working must not inherit it

**Do not rewrite ADR 0067.** Split tests so AO-13–22 cannot delete Guided chooser.

## Goal

Keep Guided co-equal Create architecture + Review. Working tests that assert “no reviews/new chooser” must be mode-gated.

Job chooser on `reviews/new` (`reviews-new-job-chooser-section`) is Guided/eval — not Working.

## Why

Every prior wave accidentally deleted teaching. This file is the regression lock after locator changes.

## Context

- ADR 0067
- e2e `first-run-wizard.spec.ts`
- CA-36

## What to build

1. Vitest/e2e: Guided chooser visible; Working Start does not mount it.
2. Do not delete the chooser component.

## Acceptance criteria

- Do not auto-migrate Guided seats to Working.

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
