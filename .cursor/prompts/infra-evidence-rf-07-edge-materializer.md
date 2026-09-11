# IE-RF-07 — Materialize catalog associations into security/inventory edges

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-01**. Consume ZIP rows from **IE-RF-04–IE-RF-06** (fixtures are enough if those prompts are not merged).

## Goal

Extend `AzureInventorySecurityEdgeMaterializer` (and IE-03 graph materialize if it has a separate relationship path) so every catalog `associationType` becomes a snapshot relationship with honest `ProvenanceKind`, `GraphEdgeInferenceSources`, and `GraphEdgeTypes`. Heuristic `nsgAllowRule` stays DeterministicInference.

## Why

SA-02 already maps four association types. New rows would otherwise be ignored, so diagrams and path engines would not improve.

## Context

- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs` (`AddNetworkAssociationEdges`)
- `ArchLucid.Application.Tests/InfraEvidence/AzureInventorySecurityEdgeMaterializerTests.cs`
- `ArchLucid.KnowledgeGraph/WellKnownGraph.cs` (`GraphEdgeTypes`)
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs`
- `docs/library/SECURENOW_ARCHITECT_PLANE.md` §4
- `.cursor/prompts/securenow-architect-02-inventory-security-edges.md` (do not re-run SA-02; **extend**)

## What to build

1. Map:

   | associationType | EdgeType | Provenance | InferenceSource (new constants) |
   |---|---|---|---|
   | `vmToNic` | `CONNECTS_TO` | ObservedFact | `inventory-vm-nic` |
   | `nicToSubnet` | `CONNECTS_TO` | ObservedFact | existing NIC subnet |
   | `nicToNsg` | `APPLIES_TO` | ObservedFact | `inventory-nic-nsg` |
   | `subnetToNsg` | `APPLIES_TO` | ObservedFact | `inventory-subnet-nsg` |
   | `subnetToRouteTable` | `APPLIES_TO` | ObservedFact | `inventory-subnet-route-table` |
   | `vnetPeering` | **`PEERS_WITH`** (add constant) or `CONNECTS_TO` if you can prove PEERS_WITH is unnecessary — prefer **add `PEERS_WITH`** in `GraphEdgeTypes` (own reason: peering is not generic connects) | ObservedFact | `inventory-vnet-peering` |
   | `peToNic` / `peToSubnet` / `privateEndpointTarget` | `CONNECTS_TO` | ObservedFact | existing PE source or siblings |
   | `agwToBackend` | `CONNECTS_TO` | ObservedFact if ARM-ARM; DeterministicInference if FQDN skip already happened | `inventory-agw-backend` |
   | `lbToBackend` | `CONNECTS_TO` | ObservedFact | `inventory-lb-backend` |
   | `privateDnsVnetLink` | `CONNECTS_TO` | ObservedFact | `inventory-private-dns-vnet` |
   | `appServiceToSubnet` | `CONNECTS_TO` | ObservedFact | `inventory-appservice-subnet` |
   | `nsgAllowRule` | `ROUTES_TO` | DeterministicInference | existing |
   | `publicIpToNic` | `EXPOSES` | ObservedFact | existing |

2. Unknown `associationType` → completeness warning `association-type-unmapped:{type}`, **no edge**, do not throw.
3. Weight &lt; 1 for non-ObservedFact (parity with SA-02).
4. Tests: one test per new type; `nsgAllowRule` is **not** ObservedFact; unknown type warns; MaxNodes warning unchanged; no new `management.azure.com` client (existing architecture test).
5. Do not run path search (SA-03/SA-05).

## Acceptance criteria

- Still one collector family.
- Display-only VM→VNet is **not** materialized as ObservedFact here (**IE-RF-08**).

## Constraints

- Compile: `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Tests: `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AzureInventorySecurityEdgeMaterializer'`

## Done when

A ZIP fixture with `vmToNic` + `subnetToNsg` + `vnetPeering` produces three labeled relationships an engine can traverse.
