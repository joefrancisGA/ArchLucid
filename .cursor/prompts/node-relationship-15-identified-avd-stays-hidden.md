# NR-15 — An identified AVD resource stays off the plate

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-14. Do not re-run NR-01 through NR-14. Do not add a checkbox. Do not add a name-prefix matcher.

## Goal

Once a resource is identified as Azure Virtual Desktop, Full subscription, Network, and every other general diagram omit it while `IncludeAvdAssets` is false. A connection to a load balancer, subnet, virtual network, firewall, storage account, or any other non-AVD resource does not put it back. Those other resources stay. Nothing AVD-shaped is drawn in the gap.

## Why

`InventoryDiagramAvdScopeResolver.IsAvdOnlySessionHostVirtualMachine` identifies a virtual machine or scale set from a `SessionHostToVm` edge or from an exact last-segment match with a session host. It then calls `HasProvenNonAvdRole`. That method returns true when any cited edge touches a node that is not already AVD-only, other than a NIC or disk, and the virtual machine stays on the plate.

NR-14 states that exception: "HasProvenNonAvdRole still wins" and "A virtual machine that also serves a non-AVD workload stays on the plate." `Compile_full_subscription_keeps_dual_role_vm` locks it in. The owner rejected that rule on 2026-10-01. Identification is enough. The other end of the edge is shared infrastructure and remains visible.

## What to build

In `InventoryDiagramAvdScopeResolver`:

- A virtual machine or scale set identified by `InventoryDiagramAvdEdgeSources.SessionHostToVm`, or by the existing exact last-segment session-host match, is AVD-only. Remove `HasProvenNonAvdRole` from that decision. Do not keep it as a veto under another name.
- A NIC or disk attached to an omitted session-host virtual machine is omitted with that virtual machine, including when the NIC or disk also connects to a subnet, network security group, or other shared resource. The subnet, network security group, virtual network, firewall, load balancer, and storage account stay.
- A resource that `InventoryDiagramAvdClassifier.IsSharedInfrastructureArmType` accepts is never classified as AVD-only just because an AVD virtual machine connects to it.
- Do not treat a resource name or resource-group name that contains `avd` or `vd` as identification. The two existing gates stay the only gates.
- `IncludeAvdAssets` true and `DiagramMode.Avd` still include the identified nodes and their attached NICs and disks.
- Do not emit an AVD boundary, count node, placeholder, or caption.

## Tests

Change `Compile_full_subscription_keeps_dual_role_vm` so it expects the opposite result. Extend `InventoryDiagramAvdIsolationApplierTests`.

1. A virtual machine with a `SessionHostToVm` edge and a cited edge to a load balancer is absent from Full subscription when `IncludeAvdAssets` is false. The load balancer remains. No node has `IsAvdCollapsedBoundary`.
2. The NIC cited to that virtual machine and also cited to a subnet is absent. The subnet remains.
3. The same snapshot compiled with `IncludeAvdAssets` true includes the virtual machine and the NIC.
4. A virtual machine with no session-host edge and no exact session-host name match remains, including when its resource name contains `avd`.
5. `DiagramMode.Avd` includes the session-host virtual machine.

## Acceptance criteria

- An identified AVD resource is absent from the general diagram until **Show AVD Assets** is checked.
- A connection to shared infrastructure does not restore it.
- The shared infrastructure itself stays on the plate.
- No AVD boundary, count, or caption replaces the hidden resource.
- Resource names and resource-group names are not a new identification rule.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `InventoryDiagramAvdIsolationApplierTests` and `InventoryDiagramAvdClassifierTests`.
- Do not commit. Do not edit unrelated dirty files.
- Do not add an icon pack. Do not collect new Azure data. Do not change the extractor.

## Done when

A session-host virtual machine that also connects to a load balancer is absent from Full subscription until Show AVD Assets is checked, and the load balancer is still on the plate.
