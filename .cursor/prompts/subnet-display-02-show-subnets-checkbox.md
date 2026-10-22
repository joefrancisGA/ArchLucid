# SB-02 — Show subnets checkbox

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SB-03 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md`

**Depends on:** SB-01. Analysis must already ignore a peeled subnet that is still in inventory.

## Goal

The diagrams workbench has a **Show subnets** checkbox on the diagrams that draw virtual-network structure. Checked, those diagrams include subnet cards. Unchecked, they keep today's peeled plate. The checkbox starts unchecked in this session.

## Why

SB-01 keeps hidden subnets for analysis. The owner also wants to see them when a diagram is about the network, without putting subnet cards on every plate.

`Show private endpoints` is the pattern. The workbench stores `includePrivateEndpoints` in the page URL and sends `includePrivateEndpointNodes` on the Mermaid preview and render requests. Peel then keeps or drops that type for the render. Subnets need the same switch. Peel rank 20 stays the default exclusion.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (the **Show private endpoints** checkbox)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-api.ts`
- `ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceSnapshotsController.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/InventoryDiagramPeelBudgetApplier.cs`
- `ArchLucid.Contracts/InfraEvidence/DiagramPeel/DiagramPeelCatalogDefaultSeed.cs`

## What to build

Add a display flag, default false.

- Page URL parameter: `includeSubnets`. Absent or `0` means hidden. `1` means show.
- Mermaid preview and render query: `includeSubnetNodes`. Follow the same controller and parser path as `includePrivateEndpointNodes`.
- When `includeSubnetNodes` is false, keep peeling `Microsoft.Network/virtualNetworks/subnets`.
- When `includeSubnetNodes` is true, omit that ARM type from the peel set for that render. Draw each subnet with the existing resource card. Do not add a subnet frame or a subnet bounding box.

Show the checkbox, label **Show subnets**, `aria-label="Show subnets"`, `data-testid="infra-diagrams-show-subnets"`, beside **Show private endpoints**, on these modes only:

- Architecture
- Network
- Security
- Full subscription
- One resource group
- Resources you picked
- What depends on one resource

Hide it on Executive, Identity, Data, Data flow, Data architecture, Business continuity, and AVD. Those requests stay `includeSubnetNodes=false`.

This session does not check the box when Network is selected. SB-03 does that. Here, every listed mode starts unchecked unless the URL already says `includeSubnets=1`.

SB-01 still applies when the box is unchecked. A hidden inventory subnet is not reported as gone.

Update the OpenAPI snapshot and the generated client the same way `includePrivateEndpointNodes` is published. Do not invent a second Mermaid endpoint.

## Tests

1. Render with the flag false: a subnet node is absent, and a Bastion on an inventory subnet does not say the subnet no longer exists.
2. Render with the flag true: the subnet card is present and the Bastion does not say the subnet no longer exists.
3. The workbench checkbox is visible on Network and Architecture, hidden on Executive and Data flow, and a click sets `includeSubnets=1` and sends `includeSubnetNodes=true`.
4. A URL with `includeSubnets=0` leaves the box unchecked.

## Acceptance criteria

- **Show subnets** is a display control, not an analysis switch.
- Unchecked plates still omit subnet cards.
- Checked plates show the subnet cards that peel rank 20 would have removed.
- The false Bastion subnet report from SB-01 stays gone in both positions.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once for the API or synthesis project you edit, using `.\scripts\ci\agent-compile-check.ps1` with that `-ProjectPath`.
- From `archlucid-ui`, run the diagrams workbench test and the Mermaid URL test you add.
- Do not commit. Do not edit unrelated dirty files.

## Done when

The owner can check **Show subnets** and see subnet cards, and can clear it and return to the peeled plate, without Bastions reporting a hidden subnet as missing.
