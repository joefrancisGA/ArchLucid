# SH-06 — Standards and rules help and `/governance/standards-and-rules` drawer

**Do not** delete Architecture “rules applied to a review” copy. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Security standards-and-rules Category-1 and `/help/standards-and-rules` describe **effective ARC-AMPE (and other pack) rules for the active workspace/project scope**: enforcement mode, source pack, conflicts, precedence, export snapshot. Empty state is “after packs are assigned to this scope”, not “after a policy pack applies checks to a review”. Architecture may keep review-scoped wording if the Architecture page is still review-scoped.

## Why

`standards-rules-rows.ts`: “Inspect standards and policy rules applied to a review”; empty “Rules appear after a policy pack or policy configuration applies checks to a review”; help drawer “Open standards & rules for the review in scope”.

SecureNow compliance home: “Inspect effective ARC-AMPE rules, conflicts, and precedence for the active workspace scope.”

Read the live page (`StandardsAndRules` client / `standards-rules-page`) before writing — if Architecture still binds to a review id and Security uses workspace scope, the help must split. If both shells already use workspace scope, Security copy should still not say “the review in scope”.

## Context

- `archlucid-ui/src/lib/contextual-help/standards-rules-rows.ts`
- `archlucid-ui/src/lib/standards-rules-page.ts` (and related help-guide-content)
- `archlucid-ui/src/lib/usability/page-help-topic-rows-operator-governance.ts`
- `archlucid-ui/src/lib/product-line/securenow-compliance-home-copy.ts`
- Live page under `archlucid-ui/src/app/(operator)/governance/standards-and-rules/`

## What to build

1. Security Category-1: what = effective rules for this scope; next = open a rule, follow findings or evidence, export snapshot; empty = assign packs first; configure = policy packs. Actions already point at policy packs / findings — keep those dests; rewrite the sentences.
2. Security `/help/standards-and-rules` body and drawer: “workspace scope” not “review in scope”.
3. Vitest: Security fixtures fail if `whatIsThisPage` contains “applied to a review”. Architecture may still say review.

## Acceptance criteria

- Security F1 matches workspace-scoped effective rules, conflicts, precedence.
- Learn more stays `standards-and-rules` (or omit). No governance-approval.
- Architecture help unchanged if that page is still review-bound.

## Constraints

- Read the live page first; do not invent a review picker if the UI has none.
- Stage standards-rules help + rows + tests.
