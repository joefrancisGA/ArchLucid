# AO-17 — Ctrl+K Working: Open architecture before Open review

**Do not fork PC-11 / CA-34 / LD-08.** Work actions first, then architecture nouns, then inbox.

## Goal

Working command palette:

1. Work actions for the **open architecture** (start review, resume in-flight, save draft) before nav dumps.
2. “Open architecture…” search identities.
3. “Open review…” is a child search **or** inbox jump — not the first group.

First Ctrl+K must still hit the listener (LD-08).

## Why

PC-11 put work before nav. Palette still opens reviews as if they were files. Files are architectures.

## Context

- palette registry / shortcut overlay
- CA-34
- PC-11

## What to build

1. Reorder Working palette groups; add identity search if missing.
2. Vitest: first work group has no `reviewDetailPath` without architecture context.
3. Guided palette may keep review-first teaching.

## Acceptance criteria

- No single-letter shortcuts (WCAG 2.1.4).

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
