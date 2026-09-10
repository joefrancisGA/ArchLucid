# AO-04 — Next.js nested review job under the architecture identity

**Do not fork CA-27** child table. **Do not collapse** review workspace tabs. **Do not** delete `/architecture/reviews/[reviewId]` until AO-06 redirect exists.

## Goal

Add App Router pages:

`/architecture/architectures/[architectureId]/reviews/[reviewId]/**`

Reuse `ReviewDetailWorkspace` (and print / findings / provenance children). Working `Link` / `router.push` after spawn, Start review, and list rows use the nested path when `architectureId` is known.

Mismatch (review’s `architectureId` ≠ route param) → 404 or identity desk with honesty, not a silent cross-architecture render.

## Why

The review workspace is the governed job UI. It must hang off the parent locator or bookmarks will keep teaching a pipeline product. Nesting is a URL change, not a table merge.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/page.tsx`
- sibling findings / print / provenance pages
- `reviewDetailPath` (legacy)
- ADR 0077 / AO-02 builders

## What to build

1. Nested `page.tsx` (and existing child segments) compose the same workspace component.
2. Pass `architectureId` from the route into workspace chrome (AO-34 sticky header can finish identity).
3. Vitest or Playwright mock: nested URL renders tabs; wrong architecture id does not show another tenant’s job (404/empty).
4. Keep legacy page working for Guided + AO-06.

## Acceptance criteria

- Full primary tab strip still visible (DR-11 pin test pattern).
- No new SQL.

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
