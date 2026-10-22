# SH-10 — Infrastructure overview `/governance/infrastructure`

**Do not** use cloud-connections as Learn more. **Do not** restore this hub as a sidebar row if product-line nav already hides it. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Category-1 and Learn more for `/governance/infrastructure` (exact path only — children get SH-11–SH-17, SH-26). Copy matches the live hub: Azure inventory evidence workbenches, recommended first step resource explorer, six destinations. Security home grouped intro may share this surface when rendered inside overview; do not describe architecture reviews or connector setup as the page job.

## Why

No dedicated overview row. Drawer: `/governance` Approval. Learn more: `page-help-topic-rows-operator-governance.ts` prefix `GOVERNANCE_INFRASTRUCTURE_PATH` → slug `cloud-connections` (all children inherit unless they have a longer topic prefix — drift and extract-upload do).

Live copy: “Open Azure inventory evidence workbenches for snapshots, diagrams, diagram reconciliation, resource hubs, grounded Ask, and remediation instances.” Recommended: resource explorer.

SecureNow nav **filters this href out of the infrastructure group** (`shapeNavLinksForProductLine`) because Home `/` carries grouped dests — the route can still be reached. Help must still match if the page loads.

## Context

- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` — overview lead, start-here, workbenches heading
- `archlucid-ui/src/lib/usability/page-help-topic-rows-operator-governance.ts`
- `archlucid-ui/src/lib/contextual-help/governance-approval-rows.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`
- `archlucid-ui/src/lib/product-line/filter-nav-groups-for-product-line.ts`

## What to build

1. Contextual row prefix **exactly** `/governance/infrastructure` is dangerous because `startsWith` would steal children. Prefer a **exact-path matcher** (like Settings hub / home `/`) **or** rely on longer child prefixes from SH-11–SH-17/26 landing in the same PR family. This prompt must either:
   - add an exact-match overview entry and land child rows in the same session, or
   - add only the overview exact matcher and leave children to SH-11+ (document that children still steal until those prompts run).
   Preferred: exact-match for overview (path === prefix, not `startsWith`), same pattern as home `/` in `architecture-rows.ts`.
2. Copy from overview page lead + start-here. Actions: resource explorer. Empty: workbenches exist even with no snapshots; snapshot-backed dests empty after inventory capture.
3. Learn more: omit, or a new slug `governance-infrastructure` / `infrastructure-overview` whose primary job is this hub. **Not** `cloud-connections`.
4. Vitest: `pageHelpTopicForPathname('/governance/infrastructure')` is not `cloud-connections`. Children must not inherit overview Learn more if you use `startsWith`.

## Acceptance criteria

- Overview F1 lists workbenches and resource explorer first step.
- Learn more is not cloud-connections or governance-approval.
- Child routes are not accidentally given overview copy unless SH-11+ have not landed — if so, call that out in the PR.

## Constraints

- Exact-match overview so terraform/diagrams/etc. do not inherit “six destinations” copy.
- Stage overview row + topic map + tests.
