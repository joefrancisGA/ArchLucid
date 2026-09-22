# SH-05 — Policy packs help and `/governance/policy-packs` drawer

**Do not** rewrite Architecture policy-pack help to drop review assignment. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Security policy-packs Category-1 and `/help/policy-packs` describe **assigning the bundled ARC-AMPE Architecture Themes pack**, priority floors, and scope assignment for cloud-evidence scans. Diagram/apply copy must not say “apply a pack when starting a review” or “finalized review record” as the primary outcome. Architecture keeps tenant/workspace/project merge **and** review-run application.

## Why

`governance-audit-policy-rows.ts` hub: “how packs apply to architecture reviews”; next “apply a pack when starting a review”; empty “library is populated”; steps “Apply a pack when starting or updating a review baseline.”

`policy-packs-help-guide-content.ts` diagram subgraph `apply["Review outcomes"]` → Governance evaluation → Findings and alerts → Finalized review record.

SecureNow compliance home: “Assign the bundled ARC-AMPE Architecture Themes pack and tune priority floors for cloud evidence scans.”

## Context

- `archlucid-ui/src/lib/contextual-help/governance-audit-policy-rows.ts`
- `archlucid-ui/src/lib/policy/policy-packs-help-guide-content.ts`
- `archlucid-ui/src/lib/policy/policy-packs-help-page-copy.ts`
- `archlucid-ui/src/lib/usability/page-help-topic-rows-operator-governance.ts` — `/governance/policy-packs` → `policy-packs`
- Policy packs hub client under `archlucid-ui/src/app/(operator)/governance/policy-packs/` (read live tabs/CTAs before writing)
- `archlucid-ui/src/lib/product-line/securenow-compliance-home-copy.ts`

## What to build

1. Security Category-1: what = assign/order ARC-AMPE (and other) packs for this workspace; next = open a pack, set priority floors, then open standards & rules or findings; empty = after bundled packs are available / assigned; configure = workspace/project scope in the header. Actions: standards & rules, findings — not “start a review”.
2. Security `/help/policy-packs`: replace review-outcome diagram branch with findings against inventory + audit lineage (honest: packs still merge by tenant/workspace/project). Do not claim sealed architecture packages.
3. `/help/policy-packs` drawer: live dest Policy packs; findings/standards as follow-ups.
4. Vitest both product lines. Architecture diagram may keep finalized review record.

## Acceptance criteria

- Security F1 does not tell the operator to start or update a review baseline.
- Security help article outcomes are findings / effective rules / audit evidence, not sealed review records.
- Architecture policy-pack help still explains hierarchical merge into a review run.

## Constraints

- Do not author new pack content or change ARC-AMPE pack #24 scope.
- Stage policy-pack help + contextual rows + tests.
