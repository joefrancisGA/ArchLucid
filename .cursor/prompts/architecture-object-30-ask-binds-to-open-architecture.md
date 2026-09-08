# AO-30 — Ask on Working binds to the open architecture’s current job

**Do not fork WA-05 / WA-07 / LS-05.** Empty Ask without a package must name the architecture, not open a blank tool.

## Goal

Working Ask: if last-open architecture has a current review/draft, Ask uses that run id. If not, CTA is “Start review on {name}” / open desk — not an empty Insights island.

Do not tenant-wide Ask while a system is open without an explicit scope chip.

## Why

Ask that ignores the open package is a chatbot. Ask that is bound to the system is an instrument.

## Context

- ASK_REVIEW_QUESTIONS_PATH
- LS-05 / WA-05
- last-open + current child

## What to build

1. Resolver: architecture → current review id.
2. Empty state copy + CTA to desk.
3. Vitest on resolver.

## Acceptance criteria

- Ask answers still honor quiet engines / skipped MUST (WA-07) — do not strip honesty.

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
