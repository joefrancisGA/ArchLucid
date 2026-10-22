# SB-03 — Network defaults Show subnets on

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md`

**Depends on:** SB-02. The **Show subnets** checkbox and `includeSubnetNodes` flag already exist and default off.

## Goal

Choosing **Network — what can reach what** from the diagram type dropdown checks **Show subnets**. The Network plate then includes subnet cards. The other diagram types keep the unchecked default from SB-02.

## Why

Subnet cards are too noisy for the sponsor and data plates, and they are part of the network plate. The owner wants that choice made by the dropdown: pick Network, and the checkbox is already checked. A later clear of the checkbox still hides the cards for that visit. Choosing Network again checks it again.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (diagram type dropdown and `handlePrivateEndpointsToggle`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` (`INFRA_DIAGRAMS_MODE_OPTIONS`, the Network value `network`)
- The SB-02 checkbox and `includeSubnets` / `includeSubnetNodes` wiring

## What to build

When the operator changes the diagram type dropdown to `network`:

- Set **Show subnets** checked.
- Write `includeSubnets=1`.
- Send `includeSubnetNodes=true` on the Network render.

When the page opens with `mermaidMode=network` and no `includeSubnets` parameter, use that same checked default.

When the page opens with `mermaidMode=network&includeSubnets=0`, leave the checkbox unchecked. That URL is an explicit hide.

When the operator clears **Show subnets** while Network is selected, keep it unchecked and send `includeSubnetNodes=false` until they choose Network from the dropdown again.

When the operator changes the dropdown from Network to another type, apply that type's SB-02 default. Architecture, Security, Full subscription, One resource group, Resources you picked, and What depends on one resource return to unchecked. Do not carry the Network check onto Executive, Identity, Data, Data flow, Data architecture, Business continuity, or AVD.

Do not change SB-01. A Network plate with the box cleared still must not report an inventory subnet as gone.

## Tests

1. Changing the diagram type dropdown from Executive to Network checks **Show subnets** and the next render request sets `includeSubnetNodes=true`.
2. Opening `mermaidMode=network` with no subnet parameter checks the box.
3. Opening `mermaidMode=network&includeSubnets=0` leaves the box unchecked.
4. Clearing the box on Network sends `includeSubnetNodes=false`. Choosing Network from the dropdown again checks it.
5. Changing from Network to Architecture unchecks the box.

## Acceptance criteria

- The Network diagram shows subnet cards by default because its checkbox is checked.
- The owner can clear that checkbox.
- Choosing Network again checks it.
- No other diagram type gains a checked default in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- From `archlucid-ui`, run the diagrams workbench tests that cover the dropdown and the new checkbox.
- Do not commit. Do not edit unrelated dirty files.

## Done when

Selecting **Network — what can reach what** checks **Show subnets**, and the Network plate includes the subnet cards until the owner clears that box.
