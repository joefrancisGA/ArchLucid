# AO-47 — CI guard: Working Start href is never a peer review path

**Do not fork CA-23 hook naming guard.** New guard for ADR 0077.

## Goal

Add a Vitest (or eslint) guard that fails if `resolveWorkingStartHref` production implementation imports `reviewDetailPath` or returns a string matching `/architecture/reviews/` + id.

Optional: route-tier-policy-nav matrix if Start is registered there.

## Why

Without CI, the next overlay will restore in-flight-review-first “because Alt+N should resume the run.”

## Context

- `working-start-route.ts`
- CA-23
- nav matrix docs

## What to build

1. Guard test file `working-start-route-architecture-locator-guard.test.ts` (or extend existing).
2. Fails on peer review path.
3. Nested `/architectures/{id}/reviews/` as a **desk child query** is OK only if the href **base** is the architecture path — prefer identity path per AO-15.

## Acceptance criteria

- Guided helpers out of scope.

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
