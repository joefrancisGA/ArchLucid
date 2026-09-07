# AO-16 — Last-open / recents store ArchitectureId, never a review as the locator

**Do not fork CA-37 / CA-38 / IS-13.** Leftover: overview still restores a review.

## Goal

Seat-scoped last-open and recents on Working write `architectureId`. Opening a nested review **updates last-open architecture**, not last-open review as the locator.

A last-open **review id** may be stored as `lastOpenReviewId` **on that architecture** (child pointer) for Resume review — not as the global locator.

## Why

IS-13 moved prefs to the server but the object was still a run. Recents that store review ids reopen the pipeline.

## Context

- operator-recent-views
- overview last-open
- CA-37 / CA-38
- server prefs if any

## What to build

1. Types: locator = architectureId; optional child reviewId.
2. Working recents click → identity path.
3. Vitest + existing recents tests updated.
4. Migration: old stored review ids — if architectureId known, promote; else honesty, do not drop the row silently.

## Acceptance criteria

- Do not use localStorage as SoT if server prefs exist (IS-13).

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
