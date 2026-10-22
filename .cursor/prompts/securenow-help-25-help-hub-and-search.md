# SH-25 — Help hub `/help` and Help search catalog (Security)

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

Run **after** SH-02–SH-06 and SH-18–SH-24 if those titles change, or land catalog exclusions first and adjust titles later.

## Goal

Security Help landing and Help search **Start here / Review work / Approval** groups match SecureNow jobs. Exclude or demote Architecture-process topics (`first-architecture-review`, `evidence-intake`, `review-packages`, `review-guide`, `choose-your-next-step` as first-review, `accelerator-chooser`, sample review, create-first-review). Hub `/help` Category-1 must not say “documentation for architects and evaluators” / “open Getting started for first-run workflow” as the only next step. Empty search hint must not be “review, evidence, findings, approval” only.

## Why

`HELP_TOPIC_CONTEXTUAL_HELP_ROWS` prefix `/help`: “curated product documentation for architects and evaluators”; next Getting started first-run.

`help-search-panel-catalog-topics.ts` Start here includes first-review-guide, review-guide, how-archlucid-works (architecture evidence). Group “Review work”. Empty hint in `help-search-panel-catalog.ts`. AWS/GCP search ids already excluded; first-review is not.

`listHelpCenterTopics` for Security still shows Architecture topics when `showAdvanced` because only AWS/GCP slugs are excluded.

`page-help-topic-rows-admin-compose.ts` prefix `/help` Learn more `getting-started` — OK **after** SH-02; until then it is a job miss.

## Context

- `archlucid-ui/src/lib/contextual-help/help-topic-rows-operator.ts` — `/help`
- `archlucid-ui/src/lib/help/help-center-catalog.ts` / `help-center-catalog-security.ts`
- `archlucid-ui/src/lib/help/help-search-panel-catalog.ts`
- `archlucid-ui/src/lib/help/help-search-panel-catalog-topics.ts`
- `archlucid-ui/src/lib/help/help-product-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-cloud-platform-policy.ts` — extend exclusions
- `archlucid-ui/src/lib/usability/page-help-topic-rows-admin-compose.ts`

## What to build

1. Security exclusions (or product-line catalog filter) for Architecture-process slugs and search topic ids. Keep Security featured list honest. Advanced may still show shared admin topics (SSO, data-handling) but not first-architecture-review.
2. Security search groups: replace “Review work” with findings/remediation/infrastructure topics; Start here = getting-started (SH-02), Azure connections, findings, assigned-to-me, authentication.
3. `/help` Category-1 for Security: help hub for SecureNow operators; next = featured dests (getting-started after SH-02, troubleshooting, security-trust).
4. Empty hint product-line-aware.
5. Vitest: Security search does not return `first-review-guide` / `connect-aws`. Architecture search still does.

## Acceptance criteria

- Security Help search Start here does not lead with Your first architecture review.
- Advanced Security help list does not feature architecture-review walkthroughs as peer product help.
- Architecture help hub unchanged.

## Constraints

- Do not delete Architecture topics from the registry — filter by product line.
- Stage catalog + search + hub drawer + tests.
