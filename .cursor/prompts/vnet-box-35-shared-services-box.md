# VN-35 — Shared services sit in one invented box

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-34. Do not re-run VN-01 through VN-34. Do not restore the VN-25 through VN-31 overview caption layer.

## Goal

On Full subscription and Network, a closed list of shared-service types leaves every resource-group frame and every VNet box. They sit together in one box this layout invents, titled `Shared services`. That box is not an Azure resource group and not a virtual network. Connectors to the workloads that use them stay.

## Why

Log Analytics workspaces, Key Vaults, user-assigned identities, action groups, and DNS zones are drawn inside the resource group or VNet that happens to contain them. A reader then treats a platform service as a member of that workload. The Azure resource group remains a fact on the card. It does not need to be the frame around the card.

## Catalog

Add `ArchLucid.ArtifactSynthesis/Layout/DiagramSharedServiceCatalog.cs`. One method, `IsSharedService(string? armResourceType)`, true only for these types, ordinal ignore-case:

- `Microsoft.OperationalInsights/workspaces`
- `Microsoft.Insights/actionGroups`
- `Microsoft.ManagedIdentity/userAssignedIdentities`
- `Microsoft.KeyVault/vaults`
- `Microsoft.Network/privateDnsZones`
- `Microsoft.Network/dnsZones`

A type not on this list stays where VN-08 and VN-15 seated it, including a resource the ledger calls Unknown. Do not grow the list from connection state.

## What to build

Only when `IsVnetPrimaryTitle` is true.

Before `BuildVnetPrimaryPlacements` assigns VNet membership, remove every catalog node from VNet member sets and from resource-group cells. A private-endpoint edge, a diagnostic edge, or any other cited edge is not deleted. VN-10 still draws `private endpoint` from a Key Vault or DNS zone to the virtual network. The card is outside the VNet box.

Pack the removed nodes in one frame:

- Frame id `shared-services`. There is no ARM id and no Azure resource-group name on the frame.
- Title `Shared services`.
- Draw it with the existing resource-group frame emitter so the stroke matches a frame, and set `data-frame-kind="shared-services"` and `data-neighborhood-id="shared-services"`. Do not set a resource-group name on the frame.
- Place the box once, after the VNet neighborhoods and shared resource-group cells, as its own row. It is not nested in a VNet and not nested in a resource group.
- The card keeps the resource-group name it already prints. That name is the Azure fact. The frame around the card is the invented box.
- A resource-group cell or VNet box with no remaining non-anchor nodes is not drawn.
- Zero catalog nodes means no box and no neighborhood tile.

Neighborhood metadata from VN-34 gains one neighborhood when the box exists:

- `id="shared-services"`, `kind="shared-services"`, `title="Shared services"`.
- `resource-count` is the catalog nodes in the box.
- `<member>` children are those nodes, sanitized the same way as the other neighborhoods.
- `<frame id="shared-services"/>`.
- `<type>` uses the same four-type cap.
- Emit this neighborhood after `other`.
- A `<link>` counts cited edges from a catalog node to a node in another neighborhood. Same skip rules as VN-34: no layout-only edges, no `InventoryResourceGroupCollocation`, no edge whose ends are both in this box.

`DiagramResourceGroupGraphvizClusterPlanner` must not put these nodes back inside an Azure resource-group cluster or a VNet cluster. One cluster, label `Shared services`, same membership. Do not retune Graphviz.

## Tests

`DiagramForestVnetFrameLayoutTests.cs`, using the existing `Inventory` helper.

1. A Log Analytics workspace and a Key Vault in resource group `rg-app`, plus a virtual machine in that group cited into a VNet. The workspace and the vault are inside the `shared-services` frame. The virtual machine stays in the VNet box. The `rg-app` frame is absent when those two were its only other cards. A private-endpoint edge from the vault to the VNet is still drawn. The neighborhood metadata has `kind="shared-services"`.
2. A virtual machine of a type not on the catalog stays in its resource group. It is not in the shared-services frame.
3. A diagram with no catalog types emits no `shared-services` frame and no `shared-services` neighborhood.
4. An Executive title emits no shared-services frame.

## Acceptance criteria

- The six catalog types are never inside a VNet box or an Azure resource-group frame on Full subscription or Network.
- One invented box holds all of them, from every resource group.
- A connector from a shared service to a VNet or workload is still visible.
- Unknown resources that are not on the catalog stay where they were.
- Executive, resource-group, and data-flow diagrams do not gain this box.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestVnetFrameLayoutTests'`.
- Run `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'` once.
- Do not commit. Do not edit unrelated dirty files.
- Do not change the extractor, `PlateTargetAspect`, `MIN_ARCHITECTURE_DIAGRAM_ZOOM`, or the neighborhood zoom fit.
- Do not add an icon pack. Do not add a question form.

## Done when

On Full subscription, the workspace, vault, identity, action group, and DNS zone cards sit in one box titled Shared services, and the VNet boxes contain the workloads that use them.
