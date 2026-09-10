# SH-08 — Remediation patterns `/governance/remediation-patterns`

**Do not** treat this as the factory metrics page (SH-07) or the infrastructure remediation workbench (SH-16). Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Dedicated Category-1 (and job-matched Learn more) for `/governance/remediation-patterns`. Copy matches the live page: pattern registry, version history, YAML import always Draft, submit/approve with separation of duties (different actor). Approval language here means **pattern version approval**, not architecture-review governance approval.

## Why

Prefix steal: `/governance` Approval drawer + Learn more `governance-approval`.

Live page (`RemediationPatternsClient.tsx`): “Create, review, and approve governed remediation patterns. YAML import always lands as Draft and is not eligible for production instances until approved by a different actor.” Empty: “No remediation patterns yet. Import YAML to create a Draft version.”

## Context

- `archlucid-ui/src/app/(operator)/governance/remediation-patterns/RemediationPatternsClient.tsx`
- `archlucid-ui/src/lib/remediation-pattern-sod.ts`
- `archlucid-ui/src/lib/remediation-pattern-status.ts`
- `archlucid-ui/src/lib/contextual-help/governance-approval-rows.ts`
- `archlucid-ui/src/lib/product-line/securenow-security-home-copy.ts`

## What to build

1. Row prefix `/governance/remediation-patterns`. what = governed pattern registry; next = import YAML (Draft), submit, approve as a different actor, or open a pattern’s versions; empty = no patterns yet; configure = Operate/approve authority (SoD). Actions: factory (to see ExactMatch %) or findings — not approval-queue.
2. Learn more: new slug `remediation-patterns` or omit. If adding `/help/remediation-patterns`, teach Draft → submit → approve, YAML import, SoD. Do not reuse `/help/governance-approval`.
3. Vitest: pathname does not get Approval copy.

## Acceptance criteria

- F1 explains pattern lifecycle and SoD, not architecture-review approval.
- Import-as-Draft honesty preserved.
- Factory page still has its own row (SH-07).

## Constraints

- Do not weaken SoD copy.
- Stage patterns row + topic map (+ optional article) + tests.
