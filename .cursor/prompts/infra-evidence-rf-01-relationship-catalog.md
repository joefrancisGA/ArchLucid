# IE-RF-01 — Relationship association catalog

**Do not** collect new Azure payloads in this prompt. Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints.

## Goal

Lock a versioned catalog of `network-associations.json` `associationType` values (and how materializers map them) so later prompts emit edges instead of inventing strings. Prefer **extending** the existing ZIP sibling over a schemaVersion bump.

## Why

Today association types are a closed set of four (`nicToSubnet`, `publicIpToNic`, `privateEndpointTarget`, `nsgAllowRule`). Flatteners keep only the first NIC IP config and first private-endpoint target. Without a catalog, ARG projections and hosted lists will diverge.

## Context

- `ArchLucid.Core/AzureExtractor/AzureExtractorPackageZipEntryNames.cs`
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureNetworkAssociationCompanionRows`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs`
- `docs/architecture/INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`

## What to build

1. One catalog type in `ArchLucid.Core` (own file). Example name `AzureInventoryRelationshipAssociationTypes`. Constants for **existing** and **new** types:

   | associationType | from | to | Provenance when cited from ARM/ARG ids |
   |---|---|---|---|
   | `nicToSubnet` | NIC | subnet | ObservedFact (existing) |
   | `publicIpToNic` | public IP | NIC (strip `/ipConfigurations/`) | ObservedFact (existing) |
   | `privateEndpointTarget` | PE | target resource | ObservedFact (existing) |
   | `nsgAllowRule` | subnet (heuristic) | storage account | **DeterministicInference** — do not promote |
   | `vmToNic` | VM | NIC | ObservedFact |
   | `nicToNsg` | NIC | NSG | ObservedFact |
   | `subnetToNsg` | subnet | NSG | ObservedFact |
   | `subnetToRouteTable` | subnet | route table | ObservedFact |
   | `vnetPeering` | VNet | remote VNet | ObservedFact |
   | `peToNic` | PE | NIC | ObservedFact |
   | `peToSubnet` | PE | subnet | ObservedFact |
   | `agwToBackend` | App Gateway | backend pool member ARM id | ObservedFact if ARM id; DeterministicInference if FQDN-only |
   | `lbToBackend` | load balancer | NIC / IP config parent | ObservedFact |
   | `privateDnsVnetLink` | private DNS zone | VNet | ObservedFact |
   | `appServiceToSubnet` | App Service / Function | subnet | ObservedFact |

2. Catalog metadata per type: `AssociationType`, `FromArmKind`, `ToArmKind`, `DefaultProvenanceKind`, `DefaultGraphEdgeType` (`CONNECTS_TO` / `EXPOSES` / `APPLIES_TO` / `PROTECTS` / new `PEERS_WITH` only if RF-07 needs it — **do not add GraphEdgeTypes in this prompt** unless a compile requires a stub constant). Comment why `nsgAllowRule` is not ObservedFact.
3. JSON row shape stays `{ fromResourceId, toResourceId, associationType, ruleName? }`. Do not add a second ZIP file in this prompt. Optional `ruleName` remains NSG-rule-only.
4. Tests: every catalog type is unique ordinal-ignore-case; existing four strings still match; a typo `nicToSubNet` is **not** a catalog member (case-insensitive lookup helper).
5. Docs: 10-line note on `docs/library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md` that IE-RF collection is catalog-driven on `network-associations.json` (no second collector).

## Acceptance criteria

- No new `management.azure.com` client.
- No ARG query changes yet (**IE-RF-02**).
- SchemaVersion stays **2** unless you prove a new required ZIP entry is mandatory (it is not).

## Constraints

- Do not emit `vmToNic` rows yet.
- Do not change Mermaid.
- Compile: `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'` (or Core + Application.Tests if the catalog lives where tests already exist).

## Done when

A unit test lists all catalog types and documents provenance. Hosted and PowerShell builders still compile against the same string constants.
