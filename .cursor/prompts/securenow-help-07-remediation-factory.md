# SH-07 — Remediation factory `/governance/remediation-factory`

**Do not** reuse Approval or infrastructure-remediation workbench copy as-is. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Add a **dedicated** Category-1 row (and job-matched Learn more) for `/governance/remediation-factory`. Copy must match the live page: executive metrics (open findings, risk-weighted open, critical exposure, net burn, pattern ExactMatch %, automation %, exceptions, avg age), priority queue of operational-security findings, priority-score simulator (advisory, not a live scanner). Architecture shell, if the route is visible, may share this copy — the page is not an approval queue.

## Why

No row longer than `/governance`. Drawer today: “Approval — … across findings, approvals, audit, and policy configuration” with CTAs to `/governance/approval-queue` and `/governance/setup`. Learn more: `governance-approval`.

Live page (`RemediationFactoryClient.tsx`): “Explainable prioritization, wave planning, and executive metrics. Advisory only — no cloud apply.” Empty: “No open operational security findings to rank.”

This is a primary SecureNow Security-nav dest. Approval queue/setup are not in SecureNow nav.

## Context

- `archlucid-ui/src/lib/contextual-help/governance-approval-rows.ts` — prefix `/governance`
- `archlucid-ui/src/lib/usability/page-help-topic-rows-operator-governance.ts` — prefix `/governance` → `governance-approval`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`
- `archlucid-ui/src/lib/product-line/securenow-security-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-nav-reshape.ts`

## What to build

1. New contextual-help module/row prefix `/governance/remediation-factory`. what = ranked remediation queue + executive metrics; next = select a row, explain score, follow the finding; empty = no open operational-security findings; configure = findings / patterns (pattern coverage %). Actions: assigned-to-me or findings, remediation patterns — not approval-queue.
2. Learn more: new slug `remediation-factory` (preferred — Approval article cannot job-match) or omit until an article exists. If you add `/help/remediation-factory`, write a short Category-2 guide that mirrors the live metrics/queue/simulator and states advisory-only / no cloud apply. Register in product documentation registry. Do not feature Architecture-process topics.
3. Vitest: this pathname must not resolve Approval `whatIsThisPage` or Learn more `governance-approval`.

## Acceptance criteria

- F1 never mentions approval queue, setup, or “reviews produce findings”.
- Simulator is labeled advisory / not a live scanner (page already says this).
- Architecture Approval hub help unchanged.

## Constraints

- Do not conflate with `/governance/infrastructure/remediation` (SH-16 — instance/wave execute workbench).
- Stage new row + topic map (+ optional help article) + tests.
