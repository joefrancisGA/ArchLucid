# AO-08 — Working call sites stop minting peer `reviewDetailPath`

**Do not fork AO-02.** This is the grep + fix pass. **Do not** change CLI until AO-11.

## Goal

`rg reviewDetailPath` / `REVIEWS_LIST_PATH +` in `archlucid-ui/src` (excluding Guided, e2e Guided, marketing). Every Working production call site that means “open this job” uses `architectureNestedReviewPath` when `architectureId` is on the DTO.

`startReviewFromArchitectureHref` today passes **draftId** as `sourceArchitectureId` — that is CA-16 leftover and must pass **ArchitectureId**.

## Why

Helpers without call-site conversion leave the old product one import away. The sourceArchitectureId bug will nest under the wrong parent.

## Context

- `architecture-routes.ts` (`startReviewFromArchitectureHref`, `reviewDetailPath`)
- palette, Home, desk child table, compare pin (DR-11)
- `working-start-route.ts`

## What to build

1. Fix `SOURCE_ARCHITECTURE_QUERY_PARAM` to ArchitectureId.
2. Convert Working call sites; leave Guided on `reviewDetailPath`.
3. Vitest: start-review href contains identity id, not draft id, when both exist.
4. Optional eslint `no-restricted-imports` for `reviewDetailPath` inside Working-only modules (list them).

## Acceptance criteria

- No behavior change for Guided first-review wizard URLs.

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
