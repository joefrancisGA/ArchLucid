# AO-10 — Sponsor email and career export deep links open the architecture desk

**Do not fork PC-13 / DR-10** honesty. Change hrefs only.

## Goal

Outbound Working deep links (sponsor email CTA, first-value report “open in ArchLucid”, board-pack footer) use nested architecture URLs. Unlinked jobs keep peer URLs with the same honesty as AO-06.

## Why

Exports are what executives bookmark. A PDF that deep-links to a run teaches the wrong object.

## Context

- Sponsor email templates / first-value report links
- board-pack / decision receipt “open” URLs
- C# link formatters if any

## What to build

1. Shared formatter on C# and/or TS (one SoT — prefer TS builder imported by tests, or C# if already SoT).
2. Tests: linked review → path contains architectureId and reviewId; unlinked → peer path + no fake parent.
3. Scoped compile if C# changes.

## Acceptance criteria

- Claim discipline: do not imply the link is a sealed record if it opens a draft.

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
