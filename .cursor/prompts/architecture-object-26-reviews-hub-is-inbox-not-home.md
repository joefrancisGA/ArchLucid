# AO-26 — Working Reviews hub is a cross-architecture inbox

**Do not fork AD-07** column layout. Change **role** of the hub.

## Goal

Working `/architecture/reviews`:

- Page title/helper: inbox of jobs across architectures (with architecture name column linking to the desk).
- Default sort still useful for triage.
- Primary empty CTA: open Architectures, not “start a review” with no parent (or start review **after** picker — AO-22).

Do not use this route as `resolveWorkingStartHref` target.

## Why

The hub is the strongest competitor to the architecture as Monday morning. It should work like an email inbox: useful, not Home.

## Context

- `architecture/reviews/page.tsx`
- AD-07 eleven-column hub
- CA-39 first-20

## What to build

1. Copy + architecture column + row click policy: job → nested URL; name → desk.
2. Vitest: Working hub fixture helper text; Start not pointed here.
3. Guided hub may remain “your reviews.”

## Acceptance criteria

- Sticky identity columns at 1280px (AD-12) still apply.

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
