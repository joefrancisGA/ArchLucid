# AO-22 — Start review from the desk does not open `/reviews/new` as a second product

**Do not fork IS-03 chooser.** Working Start review is a job of **this** architecture.

## Goal

Working “Start review” from the identity desk:

- Prefills `sourceArchitectureId` with **ArchitectureId** (AO-08).
- Prefer in-desk or nested `/architecture/architectures/{id}/reviews/new` over peer `/architecture/reviews/new` without source.
- Path chooser / Guided wizard stay off Working (IS-03).

Peer `/architecture/reviews/new` on Working without source is an inbox action that **must pick an architecture** before execute (picker, not two-product chooser).

## Why

`REVIEWS_NEW_PATH` is a peer start product. Unscoped new-review is how identities get dropped at spawn.

## Context

- `REVIEWS_NEW_PATH` / `startReviewFromArchitectureHref`
- reviews/new page
- CA-16 spawn copies architecture id

## What to build

1. Desk CTA always includes architecture id.
2. Working `/reviews/new` without source: architecture picker required (disable execute until selected) — TB-2005.
3. Vitest: submit payload includes ArchitectureId.
4. Guided `/reviews/new` chooser unchanged.

## Acceptance criteria

- Do not merge intake kernel with execute kernel (0068).

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
