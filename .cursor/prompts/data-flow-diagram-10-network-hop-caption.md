# DFV-10 — Say what a network hop is for

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-06, DFV-07, DFV-08, or DFV-09 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. Do not redo NR-07 and do not reopen the evidence catalog.

## Goal

On **Data flow — what may connect**, an application gateway, firewall, NAT gateway, load balancer, or private endpoint says which path it already has evidence for. A hop with no cited path says so. Virtual networks, subnets, NICs, and NSGs stay off this canvas.

## Why

`AzureInventoryDataFlowStageResolver` places those hop types in the Application column. `AzureInventoryDataFlowEvidenceCatalog` then excludes `firewallToSubnet`, `natGatewayToSubnet`, `peToSubnet`, `appServiceToSubnet`, and `nicToSubnet` from the painted edges. The cards remain, with no line that tells a reviewer what they front.

`InventoryDiagramDataFlowTraversalHopApplier` already writes hop evidence onto `DataFlowTraversalHopEvidenceDetails`. `DiagramNodeHumanCaptionFactory` folds that text into `CombinedPlainText`. The forest card paints the resource name, not that text.

This session paints the evidence that is already there. It does not draw the excluded attachment edges.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceCatalog.cs`
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryDataFlowStageResolver.cs` (`IsDataFlowTraversalHopArmType`)
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramDataFlowTraversalHopApplier.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramDeterministicRepairer.cs`

## What to build

1. Branch `dfv/10-network-hop-caption` from current `master`.
2. On a data-flow canvas, for these ARM types only, paint one line under the name:
   - `Microsoft.Network/applicationGateways`
   - `Microsoft.Network/azureFirewalls`
   - `Microsoft.Network/natGateways`
   - `Microsoft.Network/loadBalancers`
   - `Microsoft.Network/frontDoors`
   - `Microsoft.Cdn/profiles`
   - `Microsoft.Network/privateEndpoints`
   - `Microsoft.Network/virtualNetworkGateways`
3. When `DataFlowTraversalHopEvidenceDetails` has entries, paint the first two, joined by ` · `. When it is empty, paint `No cited path`.
4. Keep those details through `MermaidDiagramDeterministicRepairer`. The repairer already copies the list on current `master`. Add a test so a later edit cannot drop it.
5. Do not add VNet, subnet, NIC, or NSG nodes. Do not paint `firewallToSubnet`, `natGatewayToSubnet`, `peToSubnet`, `nicToSubnet`, `appServiceToSubnet`, or `diagnosticToDestination`.
6. Do not move these cards into Source, Storage, or Not staged.
7. Tests: a data-flow firewall node with evidence `to subnet snet-app` renders that phrase. A NAT gateway with no evidence renders `No cited path`. The SVG does not contain a node labeled as a virtual network. A Full subscription canvas does not gain `No cited path`.

## Acceptance criteria

- Each listed hop card has either a cited path or `No cited path`.
- The evidence catalog exclusions stay in force.
- AVD host pools and desktops are unchanged.
- No new collector and no route-table parser changes.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not draw a network map inside Data flow.
- Working-tree safety. Stage only the caption, the repairer test, and the layout tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForest|FullyQualifiedName~DataFlowTraversal|FullyQualifiedName~MermaidDiagramDeterministicRepairer"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open Data flow on `Hmd_HI_HAP_Non_Prod`. `fw_hi_nprd_wus` and `ng-edw-hi-*` should say either the path they already cite or `No cited path`. Virtual networks and subnets should still be absent. Wait for that look before any commit.
