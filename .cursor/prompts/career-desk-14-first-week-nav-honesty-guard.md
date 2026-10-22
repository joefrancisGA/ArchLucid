# CD-14 — CI guard: first-week copy cannot claim Working sidebar lock

**Do not fork CD-01** for the copy rewrite. This file is the **platform leftover**: after CD-01, a future agent can put “unlock in the sidebar after your first committed review” back into `first-week-route-guidance.ts` while `skipProgressiveNavDensity` stays true. Casual codebases rely on memory. Livelihood desks use a guard.

## Goal

A focused Vitest (pattern: `production-desk-chrome-eval-guard.test.ts`, `livelihood-document-guard-guard.test.ts`) fails if Working-mode first-week strings claim Operate nav is hidden until first commit. Guided-only strings may still say that. Do not parse the whole repo.

## Why

CD-01 is a copy fix. Without a guard it regresses the first time someone “helps” first-run conversion.

## Context

- `archlucid-ui/src/lib/first-week-route-guidance.ts`
- `archlucid-ui/src/hooks/useOperatorShellNavRows.ts` — `skipProgressiveNavDensity`
- `archlucid-ui/src/lib/production-desk-chrome-eval-guard.test.ts` — style
- Run **after** CD-01 so the guard is green on merge

## What to build

1. Test reads Working-resolved first-week configs (the same helper CD-01 adds). Assert forbidden phrases are absent for Working: “stay out of the sidebar”, “unlock in the sidebar after your first committed”, “Graph, Compare, and heavy approval surfaces stay out of the sidebar”.
2. Guided-resolved configs may still contain deferral language.
3. Keep the test next to first-week module tests. No full-repo scan.

## Acceptance criteria

- Reverting CD-01 Working copy fails CI.
- Guided deferral copy is not banned.
- No new production runtime flag.

## Constraints

- Do not make the guard depend on Playwright.
- Do not collapse tabs.
- Do not scan `docs/`.
