# NR-14 — Session hosts stay off the plate unless Show AVD Assets is on

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-06, which is already in the tree. Do not re-run NR-01 through NR-13. Do not add a second AVD checkbox.

## Goal

Full subscription and Network keep Azure Virtual Desktop off the plate while `IncludeAvdAssets` is false, including the session-host virtual machines, NICs, and disks that still paint today. One chip states how many host pools and session hosts were left off. The existing **Show AVD Assets** checkbox remains the only way to put them back.

## Why

`DiagramAstFromGraphCompiler` already calls `InventoryDiagramAvdViewFilter.ExcludeAvdOnlyNodes` unless the mode is `DiagramMode.Avd` or Full subscription was compiled with `IncludeAvdAssets`. The diagrams workbench sends `includeAvdAssets` only when **Show AVD Assets** is checked, and that checkbox defaults off.

`InventoryDiagramAvdScopeResolver.IsAvdOnlySessionHostVirtualMachine` still requires an edge whose `InferenceSource` is `InventoryDiagramAvdEdgeSources.SessionHostToVm`. A session-host virtual machine with no such edge stays on the plate, and so do its NIC and disks. `InventoryDiagramAvdBoundaryApplier` emits a collapsed `Azure Virtual Desktop` node only when a cited edge crosses from an AVD-only node to a shared node, so a farm with no shared edge disappears without a count.

## What to build

In `InventoryDiagramAvdScopeResolver`, a virtual machine or scale set is a session host when either the existing `SessionHostToVm` edge is present, or the last ARM segment of its id equals the last segment of a `Microsoft.DesktopVirtualization/hostPools/.../sessionHosts/...` id in the same snapshot. Match ordinal ignore-case. Do not match on a name substring.

`HasProvenNonAvdRole` still wins. A virtual machine with a cited edge to a non-AVD node other than that session-host edge stays on the plate.

A NIC or disk whose only cited parent is an omitted session-host virtual machine is AVD-only with that virtual machine. A NIC or disk cited to any other virtual machine stays.

Do not change `DiagramsWorkbenchClient` or add a control. `includeAvdAssets=true` and `DiagramMode.Avd` still include the omitted nodes.

When the omitted set is non-empty, do not emit an AVD boundary, count node, placeholder, or caption. The general diagram must contain no AVD trace by default. Shared resources that also serve non-AVD workloads remain visible because they are ordinary shared resources; they must not be replaced by an AVD boundary.

## Tests

Extend `InventoryDiagramAvdIsolationApplierTests` or the scope-resolver tests beside them.

1. A host pool and a virtual machine whose id's last segment equals the session host's last segment, with no `SessionHostToVm` edge, are absent from Full subscription when `IncludeAvdAssets` is false. The plate contains no AVD boundary or count node.
2. The NIC and disk cited only to that virtual machine are absent. A disk cited to a different virtual machine remains.
3. A virtual machine with a cited edge to a load balancer remains, even when its name matches a session host.
4. The same snapshot compiled with `IncludeAvdAssets` true includes the host pool and the session-host virtual machine, and does not add the count-only boundary.
5. `DiagramMode.Avd` includes the host pool and the session host.

## Acceptance criteria

- With **Show AVD Assets** unchecked, Full subscription and Network show no host pool, workspace, application group, scaling plan, session host, session-host virtual machine, or that virtual machine's exclusive NIC and disks.
- The default plate contains no AVD node, boundary, count, or caption.
- Checking **Show AVD Assets** is the only opt-in. No new checkbox and no new diagram mode.
- A virtual machine that also serves a non-AVD workload stays on the plate.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `InventoryDiagramAvdIsolationApplierTests` and `InventoryDiagramAvdClassifierTests`.
- Do not commit. Do not edit unrelated dirty files.
- Do not add an icon pack. Do not collect new Azure data.

## Done when

A Full subscription plate with the AVD checkbox off shows one Azure Virtual Desktop count and none of the session-host virtual machines.
