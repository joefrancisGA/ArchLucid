# NR-21 — A hidden public IP marks its virtual machine public

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-22 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-17 and NR-19. Do not re-run NR-01 through NR-20. Do not edit the NR index.

## Goal

A virtual machine whose public IP card is hidden is marked **public**. An unattached public IP stays in the outline as missing a required link.

## Why

NR-19 hides the public IP card on Full subscription until **Show network details** is on. The virtual machine would then look private even though Azure stored a public IP on its network interface. The owner wants the word **public** on that virtual machine.

NR-17 already says an unattached public IP is orphaned with `no IP configuration or parent reference`. Hiding the card must not drop that outline row.

## What to build

When a public IP has a stored parent and that parent resolves to a virtual machine or virtual machine scale set that is on the diagram:

- While the public IP card is hidden, the virtual machine card shows **public**.
- While the public IP card is visible, do not add a second **public** caption. The card is the evidence.
- Reuse the existing public-exposure caption if the card already has one. Do not add a new color or a new badge component.

A public IP with no IP configuration and no NAT gateway parent:

- Stays off the plate when **Show network details** is off.
- Remains in the outline as **Missing a required link: no IP configuration or parent reference**.
- Does not mark any virtual machine **public**.

A load balancer, Application Gateway, Bastion host, firewall, or NAT gateway keeps its NR-17 attachment behavior. This prompt adds the **public** mark only on virtual machines and scale sets.

## Tests

1. Full subscription, checkbox off. A virtual machine has a public IP through its network interface. The public IP is not a card. The virtual machine shows **public**. The outline does not say the public IP is missing a required link.
2. Checkbox on for that same graph. The public IP card is present. The virtual machine does not show a second **public** caption.
3. A public IP with neither `ipConfiguration.id` nor `natGateway.id` is absent as a card when the checkbox is off, and the outline still contains `no IP configuration or parent reference`. No virtual machine is marked **public** because of it.

## Acceptance criteria

- A hidden attached public IP marks the virtual machine **public**.
- An unattached public IP remains an outline finding.
- A visible public IP card is not duplicated by the word **public**.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new mark tests and `InventoryDiagramOrphanedStateClassifierTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

Hiding a virtual machine's public IP still tells the reader the machine is public, and a public IP with no parent is still listed in the outline.
