# NR-20 — A hidden hop still draws a line between the visible ends

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-21 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-19. Do not re-run NR-01 through NR-19. Do not edit the NR index.

## Goal

When a stored path between two visible resources passes only through hidden resources, draw one line between the two visible resources. When **Show network details** puts an intermediate card back on the plate, draw the real cards and lines instead, and do not also draw the shortcut.

## Why

Full subscription hides network interfaces, subnets, and, unless the checkbox is on, public IPs, network security groups, route tables, and private endpoints. `DiagramNicCollapseApplier`, peel, and the private-endpoint pruner drop the edges that touched those cards. The visible virtual machine and virtual network then look disconnected even though the snapshot stored the path.

## What to build

Add one applier that runs after nodes have been omitted and before orphan classification.

For a stored path whose intermediate nodes are absent from the diagram:

- The ends that remain on the diagram get one line.
- The line is a cited edge. It is not layout-only and it is not resource-group collocation.
- Keep the stored association's existing display label when it already has one. Do not invent **Private access**, **Routed through**, **Sends traffic to**, or **Peered** in this session. Later prompts replace this line for those cases.
- A path with no display label uses **Connected**.
- Two visible resources get at most one shortcut for the same stored path.

When the intermediate resource is on the diagram, do not emit the shortcut. The cards and their own stored lines are the picture.

Skip a path that has no stored evidence. Do not revive `inventory-rg-collocation`.

A hidden private endpoint whose target and virtual network are both visible may already draw `private endpoint` from VN-10. Do not draw a second line beside it. NR-24 changes that label.

## Tests

1. Full subscription, checkbox off. A virtual machine, its network interface, and a subnet of a visible virtual network are stored. The diagram has one line from the virtual machine to the virtual network. The network interface and subnet are not cards.
2. The same graph with no network interface and no subnet reference has no line.
3. Checkbox on, with a public IP stored between a load balancer and that public IP's parent: the public IP card is present, and there is no extra shortcut that skips it.
4. A Key Vault and a virtual machine that only share a resource group are not connected by this applier.

## Acceptance criteria

- A stored path draws one line between the visible ends.
- A hidden intermediate card is not also drawn as a second copy of that line.
- A resource with no stored path stays disconnected.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new applier tests and one existing Full subscription compile test.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

Hiding a network interface or subnet no longer makes a stored virtual-machine path disappear, and turning **Show network details** on does not draw that path twice.
