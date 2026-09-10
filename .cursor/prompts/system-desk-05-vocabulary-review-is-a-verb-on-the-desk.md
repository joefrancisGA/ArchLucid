# SY-05 — Working copy: review is a verb on the architecture, not a destination product

Do not fork AO-03 / CA-44. Extend Working **desk and shortcut** strings only.

## Goal

Working strings that still say “Open packages” / “Architecture reviews” as if the hub were Home must become inbox or job-verb copy (“Inbox”, “Jobs of this architecture”, “Start review”). Do not rename Guided teaching. Do not rename the sealed review record.

## Why

Keyboard and related-links still say packages/reviews as the object you open in the morning. Vocabulary is how the job stays the product after URLs change.

## Context

- `archlucid-ui/src/lib/shortcut-registry.ts` (`alt+r` description “Open packages list”)
- `archlucid-ui/src/lib/i18n.ts` `OPERATOR_NAV_LINK_LABELS.packages`
- `archlucid-ui/src/lib/ask-review-questions-evidence-copy.ts` (“Architecture reviews”)
- `docs/library/CONCEPT_VOCABULARY.md`

## What to build

1. Working-mode copies only (resolver or `isWorking` branches).
2. Glossary: review = governed job of an architecture (Working); keep Guided “your reviews.”
3. Vitest on shortcut description + one evidence-copy parent label.

## Acceptance criteria

- Alt+R helper no longer reads as Monday-morning Home.
- TB-645 sealed-record wording unchanged.

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

