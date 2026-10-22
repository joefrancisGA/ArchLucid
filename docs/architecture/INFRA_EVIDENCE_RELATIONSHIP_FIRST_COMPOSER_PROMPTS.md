> **Scope:** Copy-paste Composer/Cloud Agent prompts that make Azure inventory diagrams and SecureNow path engines use **relationship-first** collection (ARG projections + type-scoped ARM lists) instead of a thin ARM property flatten / live ARM export. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](../../.cursor/prompts/infra-evidence-relationship-first-00-index.md) (**IE-RF-01–IE-RF-12**)
> **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) (plane wins)
> **Hold:** [`../library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md`](../library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md)
> **Consumers:** SecureNow architect edges (**SA-02**) and inventory Mermaid (**IE-16**, **IE-ND-***). Do **not** re-run those bodies; extend them.
> **Do not fork:** second Azure collector; `Export-AzResourceGroup`; `dependsOn` as architecture; diagram-time Azure HTTP; `IFindingEngine`; GTM **M-90 / M-44 / M-91 / M-92**; closed assurance **TB-135 / TB-136**; desktop review tab collapse

# Infrastructure-evidence relationship-first topology — Composer prompts (IE-RF-01–IE-RF-12)

**Created:** 2026-09-11 · **Status:** ready to run · **Audience:** Cursor Composer extending the **existing** extractor family so Network-mode diagrams and SA path engines see VM→NIC→subnet→VNet, NSG/UDR/peering, and L7/DNS/PaaS subnet edges.

Paste **one** `.cursor/prompts/infra-evidence-rf-NN-*.md` file per Composer session. **Do not implement from this document’s tables.**

## Why this set exists

Tier 1 already queries Resource Graph (`Resources | project id, name, type, location, tags, sku, properties`). Hosted collection lists `GET /subscriptions/{id}/resources`. Both then flatten a **first** NIC IP config and a **first** private-endpoint target. That is not ARM-export `dependsOn`, but it **behaves** like a thin ARM walk: hosted list properties are often empty; ARG `properties` truncates; there is no `vmToNic` edge.

Advice to “use ARG and ARM” is right on the **questions**. It is wrong if it means live template export or `dependsOn` arrows. This set:

1. Keeps **one collector family**.
2. Uses ARG for **typed relationship projections**.
3. Uses **type-scoped ARM list GETs** when ARG is truncated or hosted has no ARG.
4. Builds a normalized association table (`network-associations.json`) → existing materializer → Mermaid.
5. Compares **declared vs observed vs diagram vs historical** for drift (**SA-12**), not ARG vs live ARM export.

## Diagnosis → prompt

See [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](../../.cursor/prompts/infra-evidence-relationship-first-00-index.md) for the full table, run order, holds, and global constraints.

## Sequencing

| Wave | Prompts | Intent |
|------|---------|--------|
| 0 Catalog | **IE-RF-01** | Locked `associationType` strings + provenance |
| 1 Collect | **IE-RF-02**, **IE-RF-03** | ARG projections (Tier 1) + hosted type lists |
| 2 Cardinality | **IE-RF-04** | All IP configs + `vmToNic` |
| 3 Network controls | **IE-RF-05**, **IE-RF-06** | NSG/UDR/peering + AGW/LB/Private DNS/App Service |
| 4 Graph | **IE-RF-07**, **IE-RF-08** | Materialize edges; display-only VM→VNet |
| 5 Honesty | **IE-RF-09**, **IE-RF-10** | Completeness codes; optional effective NSG/routes |
| 6 Contract | **IE-RF-11** | Network mermaid golden fixture |
| Hold | **IE-RF-12** | Written hold — not implementation |

**IE-RF-01** first. **IE-RF-02** and **IE-RF-03** may run in parallel after 01. **IE-RF-10** must not block 01–09.

Feature branch per prompt (`cursor/<short-name>-9cc3` locally, or Cloud Agent `cursor/<short-name>-<suffix>`). Name the branch in any commit/push request.

## Prompt files

| ID | File |
|----|------|
| Index | [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](../../.cursor/prompts/infra-evidence-relationship-first-00-index.md) |
| **IE-RF-01** | [`.cursor/prompts/infra-evidence-rf-01-relationship-catalog.md`](../../.cursor/prompts/infra-evidence-rf-01-relationship-catalog.md) |
| **IE-RF-02** | [`.cursor/prompts/infra-evidence-rf-02-arg-relationship-queries.md`](../../.cursor/prompts/infra-evidence-rf-02-arg-relationship-queries.md) |
| **IE-RF-03** | [`.cursor/prompts/infra-evidence-rf-03-hosted-type-lists.md`](../../.cursor/prompts/infra-evidence-rf-03-hosted-type-lists.md) |
| **IE-RF-04** | [`.cursor/prompts/infra-evidence-rf-04-vm-nic-all-ipconfigs.md`](../../.cursor/prompts/infra-evidence-rf-04-vm-nic-all-ipconfigs.md) |
| **IE-RF-05** | [`.cursor/prompts/infra-evidence-rf-05-nsg-route-peering.md`](../../.cursor/prompts/infra-evidence-rf-05-nsg-route-peering.md) |
| **IE-RF-06** | [`.cursor/prompts/infra-evidence-rf-06-l7-private-dns.md`](../../.cursor/prompts/infra-evidence-rf-06-l7-private-dns.md) |
| **IE-RF-07** | [`.cursor/prompts/infra-evidence-rf-07-edge-materializer.md`](../../.cursor/prompts/infra-evidence-rf-07-edge-materializer.md) |
| **IE-RF-08** | [`.cursor/prompts/infra-evidence-rf-08-layout-display-edges.md`](../../.cursor/prompts/infra-evidence-rf-08-layout-display-edges.md) |
| **IE-RF-09** | [`.cursor/prompts/infra-evidence-rf-09-completeness-warnings.md`](../../.cursor/prompts/infra-evidence-rf-09-completeness-warnings.md) |
| **IE-RF-10** | [`.cursor/prompts/infra-evidence-rf-10-effective-controls.md`](../../.cursor/prompts/infra-evidence-rf-10-effective-controls.md) |
| **IE-RF-11** | [`.cursor/prompts/infra-evidence-rf-11-network-mermaid-contract.md`](../../.cursor/prompts/infra-evidence-rf-11-network-mermaid-contract.md) |
| **IE-RF-12** | [`.cursor/prompts/infra-evidence-rf-12-hold.md`](../../.cursor/prompts/infra-evidence-rf-12-hold.md) |

## Intentional — do not “fix”

- Do **not** add a second collector or `Get-SecureNowAttackPathPackage.ps1`.
- Do **not** `Export-AzResourceGroup` or treat live ARM export as IaC intent.
- Do **not** draw `dependsOn` as architecture (`NIC1 --> VM1`).
- Do **not** GET every resource id; use ARG projections + type-scoped lists.
- Do **not** call Azure at Mermaid render time.
- Do **not** promote the Storage `nsgAllowRule` heuristic to ObservedFact.
- Do **not** claim ARG vs ARM-export comparison is four-reality drift (**SA-12**).
- Do **not** re-open **IE-ND-01–IE-ND-05** as greenfield (Network-mode empty canvas).
- Do **not** add `IFindingEngine` types.

## Suggested compile scopes

| IDs | `-ProjectPath` / tests |
|-----|------------------------|
| **IE-RF-01** | `ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj` |
| **IE-RF-02** | Pester `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1` (+ new ResourceGraph Pester if added) |
| **IE-RF-03**, **IE-RF-04**, **IE-RF-05**, **IE-RF-06** | `ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj` |
| **IE-RF-07**, **IE-RF-09**, **IE-RF-11** | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` |
| **IE-RF-08** | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| **IE-RF-10** | Extractor tests + Application.Tests if edges map |
| **IE-RF-12** | None (hold) |

## Global constraints

See [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](../../.cursor/prompts/infra-evidence-relationship-first-00-index.md). Plane wins on conflict. Working-tree safety; one class per file; no `ConfigureAwait(false)` in tests; scoped compile; stage only files the prompt names.
