# SH-16 — Infrastructure remediation instances `/governance/infrastructure/remediation`

**Do not** reuse SH-07 factory metrics copy. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Category-1 for the **instance/wave workbench**: track remediation instances and waves with advisory-only execute honesty (preflight, approve, execute, verify against inventory snapshots). Distinct from Remediation factory (ranked queue + executive metrics) and pattern registry (SH-08).

## Why

Prefix steal + Learn more `cloud-connections`.

Live lead: `GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD`. Skip link says “Skip to remediation factory” on this workbench — that is on-page chrome naming; Category-1 must still describe **this** route’s job (instances/waves), and may mention factory as a related dest without claiming this page *is* the factory metrics dashboard.

Home: “Track remediation instances and waves with advisory-only execute honesty.”

## Context

- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx`
- SH-07 `/governance/remediation-factory`

## What to build

1. Prefix `/governance/infrastructure/remediation`. Reuse lead. Next = filter instance/wave, preflight, follow verify; empty = after findings/patterns exist; configure = factory/patterns/inventory. Actions: factory, patterns, resource explorer.
2. Learn more omit, dedicated slug, or factory article **only if** that article’s primary job includes this workbench (it should not). Prefer omit or a short `infrastructure-remediation` article.
3. Vitest: not Approval, not cloud-connections, not the same `whatIsThisPage` as SH-07.

## Acceptance criteria

- F1 is instances/waves + advisory execute honesty.
- Operator is not sent to approval-queue or start-review.

## Constraints

- Do not claim cloud apply succeeded without the page’s verify honesty.
- Stage workbench row + topic map + tests.
