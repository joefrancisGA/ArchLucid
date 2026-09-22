# SH-24 — `/help/troubleshooting`

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Security troubleshooting Category-1 and article lead: sign-in, Azure connector, inventory load, extract-upload, findings/export problems in SecureNow. Hub Security summary already says this. Drawer today: “unblock reviews, connections, and architect workflows”. Architecture keeps review-unblock copy.

## Why

`help-topic-rows-operator.ts` `/help/troubleshooting`: “symptom-first guidance to unblock reviews, connections, and architect workflows.”

Help search empty hint (SH-25) also says “review, evidence, findings, approval” — this prompt owns the troubleshooting **article/drawer**; SH-25 owns search chrome.

## Context

- `archlucid-ui/src/lib/contextual-help/help-topic-rows-operator.ts`
- Troubleshooting guide content / `troubleshooting-help-guide-content.ts`
- `archlucid-ui/src/lib/help/help-center-catalog-security.ts`
- Common-issue cards (read which issues are Architecture-only: start review, finalize, etc.)

## What to build

1. Security drawer + page intro/common-issue list: filter or rewrite cards that only apply to architecture reviews. Keep sign-in, connector, loading, export, support bundle, system health.
2. Do not send Security users to `/architecture/reviews` from a common-issue CTA.
3. Vitest both lines. Do not drop support-bundle / system-health dests.

## Acceptance criteria

- Security troubleshooting F1 does not say architect workflows / unblock reviews as the job.
- Architecture troubleshooting still covers review failures.

## Constraints

- Internal engineering runbooks stay gated (TB-735). Do not un-gate CLI doctor.
- Stage troubleshooting copy + drawer + tests.
