# AO-38 — Presenter/room handoff is architecture + job, not `?presenter=1` on a peer review

**Do not fork DR-16 / PC-09.** Room without query flag, **on the architecture locator.**

## Goal

Working presenter/room: share URL is nested architecture+review (or desk with job + room mode). `?presenter=1` must not be the only path (DR-16). Presenter answers still append to asserted trail (PC-09).

Idle restore (DR-12) must restore architecture locator, not only a review path.

## Why

Conference-room persona (R4) is a meeting about a **system**. A presenter flag on a run URL is a slideshow of a pipeline.

## Context

- `review-detail-workspace-tabs.ts` presenter
- DR-16 / PC-09 / DR-12
- AO-09 share helper

## What to build

1. Working room share uses nested locator; presenter mode can be path or data attribute (DR-16 leftover).
2. Vitest: Working share href contains architectureId.
3. Guided may keep `?presenter=1` on peer URL.

## Acceptance criteria

- No avatars/chat.

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
