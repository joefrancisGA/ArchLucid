# NR-22 — Protocols and ports sit on the visible line

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-23 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-09, NR-13, and NR-20. Do not re-run NR-01 through NR-21. Do not edit the NR index.

## Goal

When a network security group card is hidden, its protocol and port appear on the visible line between the resources that group protects. A virtual machine joined to a virtual network through a hidden subnet shows those ports on the virtual-machine-to-virtual-network line.

## Why

NR-09 and NR-13 put effective rules on a visible owner and remove the network security group card. Peel and NR-19 still hide the subnet and the network interface, so the rule can be left with no visible line to annotate. The owner wants the ports on the line the reader can see.

## What to build

Reuse `InventoryDiagramDataFlowNsgEffectiveRuleReducer` and the NR-13 chip text. Do not write a second rule parser.

On Full subscription, with **Show network details** off:

- The network security group is not a card.
- The line from NR-20 between the protected visible resource and its visible virtual network, load balancer, or other visible peer carries the effective protocol and port.
- Inbound allow rules are the ones that appear, matching NR-13.
- A deny that NR-13 already surfaces stays a deny. Do not invent a new deny design.

With **Show network details** on, the network security group card is visible. Do not also paint the same protocol and port on a shortcut that skips that card. NR-13's chips on the owner may remain.

Do not print the network security group name on the line. Do not add the rule to a resource that the group is not stored against.

## Tests

1. A subnet network security group allows TCP 443. Full subscription hides the subnet and the group. The virtual machine to virtual network line includes TCP 443.
2. The same graph with the checkbox on draws the network security group card and does not add a second shortcut labeled with TCP 443.
3. A virtual machine with no stored network security group gains no protocol or port.

## Acceptance criteria

- Hidden network security group rules are readable on the visible line.
- The group card and the shortcut are not both drawn.
- The line does not name the network security group.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new annotation tests and the existing NR-13 chip tests.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A reader can see the protocol and port on the virtual machine's line to its virtual network without a network security group card on the plate.
