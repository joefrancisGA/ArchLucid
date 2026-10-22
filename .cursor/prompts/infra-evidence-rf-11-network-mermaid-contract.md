# IE-RF-11 — Network mermaid contract for relationship-first edges

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-07** and **IE-RF-08**. Do not re-open **IE-ND-01–IE-ND-05** as greenfield; consume their helpers if present.

## Goal

Lock a golden inventory snapshot where Network-mode Mermaid includes VM, NIC, subnet, VNet, NSG, and peering **labels** and the catalog edges (plus derived VM→VNet display edge). Prevent the next flatten regression from shipping a node-only picture.

## Why

IE-ND-02 asserted VNets appear. It did not assert VM–NIC–subnet connectivity. Relationship-first work can land in the ZIP and still never reach Mermaid if the compiler filters edge types or weights.

## Context

- `InfraEvidenceSnapshotMermaidServiceTests`
- `AzureInventorySnapshotGraphResolver`
- `DiagramAstFromGraphCompiler` / `DiagramMode.Network`
- IE-ND-01 `AzureInventoryTopologyCategory` if already on the branch
- IE-RF-08 layout edges

## What to build

1. Golden fixture (Application.Tests or ArtifactSynthesis.Tests): ARM types

   - `Microsoft.Compute/virtualMachines` (app-vm)
   - `Microsoft.Network/networkInterfaces` (nic)
   - `Microsoft.Network/virtualNetworks` (vnet)
   - `Microsoft.Network/virtualNetworks/subnets` **or** subnet id only as association target (match how snapshot resources are stored today)
   - `Microsoft.Network/networkSecurityGroups`
   - second VNet + `vnetPeering` relationship

2. Relationships: `vmToNic`, `nicToSubnet`, `subnetToNsg` or `nicToNsg`, `vnetPeering`, parent `CONTAINS` as already materialized.
3. GET mermaid `mode=network` (or compile AST): `Succeeded` or `Partitioned`, NodeCount ≥ VM+NIC+VNet+NSG, Mermaid contains those labels, and an edge from VM toward NIC **or** derived VM→VNet (assert both: observed VM–NIC and derived VM–VNet if RF-08 landed).
4. Security mode may include NSG; Data mode must not drop the VNet solely because a storage account is absent.
5. Keep IE-HOTFIX tests (null ARM id, per-mode fail-soft).

## Acceptance criteria

- Categories derived from ARM type (do not pre-stamp `network` on VNets if IE-ND-01 helper exists — same rule as IE-ND-02).
- No static mermaid import in UI.

## Constraints

- Do not lower IE-17 huge-graph thresholds.
- Tests: `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'`
- Compile: `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

The golden fixture Network mermaid fails on a materializer that drops `vmToNic` and passes when RF-07/08 edges are present.
