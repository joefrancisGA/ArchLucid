# AO-34 — Sticky architecture identity chrome while the job is open

**Do not restore system-wide breadcrumbs (TB-2090).** A **desk identity header** is not a breadcrumb trail.

## Goal

Working nested review/draft: a compact identity header (name, status, link to desk) stays visible while scrolling the job. Clicking the name returns to the desk without losing the job (desk still lists it).

Do not invert deep-page back by buyer-polish (AD-03). Working back is the architecture desk.

## Why

Without sticky identity, nested URLs still feel like a new website once you scroll into findings.

## Context

- AD-03 back links
- identity display name (CA-02)
- review workspace header

## What to build

1. Header component + back-to-desk control.
2. Vitest: present on Working nested; optional/absent on Guided peer.
3. 200% zoom: header does not clip the tab strip (LS-10 leftover — don’t regress).

## Acceptance criteria

- TB-2090: no global crumbs.

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
