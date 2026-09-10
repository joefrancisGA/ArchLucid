# SH-11 — Resource explorer `/governance/infrastructure/resources`

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints. Resource **hub** (`/resources/{id}`) is the same job family — include it if prefix `startsWith` is used.

## Goal

Category-1 (and job-matched Learn more) for resource explorer and resource evidence hub. Copy matches: browse cloud resources, filters (name prefix, type, resource group), snapshot context on links only, open hub tabs (drift, findings, remediation, diagram correspondence, Terraform, audit lineage). Not Approval. Not cloud-connections setup.

## Why

Inherits `/governance` Approval drawer and `/governance/infrastructure` Learn more `cloud-connections`.

Live: `GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD` / hub lead in `governance-infrastructure-copy.ts`. SecureNow home: “Explore cloud resources and open the evidence hub for a single resource.”

## Context

- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` — resources + hub leads
- `archlucid-ui/src/lib/governance/governance-infrastructure-route-paths.ts`
- Live clients under `archlucid-ui/src/app/(operator)/governance/infrastructure/resources/`
- Topic map prefix `GOVERNANCE_INFRASTRUCTURE_PATH` → `cloud-connections`

## What to build

1. Row prefix `/governance/infrastructure/resources` (covers hub children). what = explorer / hub as appropriate — if one entry must cover both, lead with explorer and mention opening a hub. Prefer a parameterized matcher for hub if the hub job is too different (tabs for one resource).
2. Next = filter, open a hub, copy IDs for audit lineage. Empty = after inventory capture (Azure connection or extract-upload). Configure = Azure connections / extract-upload. Actions: those dests + audit-evidence — not approval-queue, not start-review.
3. Learn more: omit or dedicated `infrastructure-resources` slug. **Not** cloud-connections. Drift help is a sibling, not this page’s article.
4. Vitest both explorer and a hub path.

## Acceptance criteria

- F1 does not mention approval queue or federating AWS/GCP.
- Snapshot-context-on-links-only honesty from page copy is preserved.
- Architecture shell, if it shows this page, may share this workbench copy (job is the same).

## Constraints

- Reuse page copy. Do not document CLI/ARM internals on Category-1.
- Stage resources row + topic map + tests.
