# AO-02 — Working route taxonomy: architecture desk, nested draft, nested review, inbox

**Do not fork CA-20–24** route split. **Do not implement pages yet** if AO-01 is not Proposed in this PR — types + comments are OK.

## Goal

Lock a typed Working route taxonomy so later prompts do not invent a fifth URL shape.

| Role | Working path |
|------|----------------|
| Portfolio | `/architecture/architectures` |
| Desk (locator) | `/architecture/architectures/{architectureId}` |
| Draft job | `/architecture/architectures/{architectureId}/drafts/{draftId}` |
| Review job | `/architecture/architectures/{architectureId}/reviews/{reviewId}` |
| Inbox (secondary) | `/architecture/reviews` — no identity in the path |

Peer `/architecture/reviews/{reviewId}` remains a **legacy alias** (AO-06 redirect). `/architecture/architectures/{draftId}` as a draft editor remains a **legacy alias** (AO-07).

## Why

`architectureDraftPath` still treats the architectures collection segment as a draft id. `reviewDetailPath` is a peer product. That is two live instruments. Taxonomy must exist before redirects or Composer will re-homologate the old helpers.

## Context

- `archlucid-ui/src/lib/architecture/architecture-routes.ts`
- `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/page.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/page.tsx`
- ADR 0077 (AO-01)

## What to build

1. Export path builders: `architectureNestedReviewPath`, `architectureNestedDraftPath`, keep `architectureIdentityPath`.
2. JSDoc on `reviewDetailPath` / `architectureDraftPath`: **legacy / Guided**; Working must not add new call sites.
3. Vitest: nested paths encode both ids; desk path has no `/reviews` segment.
4. Do **not** add Next.js folders yet (AO-04 / AO-05).

## Acceptance criteria

- New Working call sites in this PR do not import `reviewDetailPath` except tests that assert legacy.
- Taxonomy table is copy-pasteable into ADR 0077 if 01 and 02 share a PR.

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
