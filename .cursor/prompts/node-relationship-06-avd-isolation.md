# NR-06 — Isolate Azure Virtual Desktop

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement NR-07 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-04.

## Goal

Keep Azure Virtual Desktop resources out of the general inventory and data-flow diagrams. Show them only when the reviewer selects the AVD diagram. Show one collapsed AVD boundary in the general diagram only where AVD has a proven relationship to a shared non-AVD resource.

## AVD boundary

Include:

- Host pools
- Application groups
- Workspaces
- Session hosts and the VMs or VM scale sets proven to serve only AVD
- Scaling plans
- AVD image definitions and templates
- Storage, Key Vault, networking, and identity resources proven to serve only that host pool

A VM or other resource with a proven non-AVD role stays in the general diagram. A session host without such a role appears only in the AVD diagram.

## What to build

Add an AVD view filter. The general and data-flow projections call it and omit AVD-only nodes and their internal edges.

When an AVD resource has a cited edge to a shared VNet, firewall, identity provider, or storage account that also serves non-AVD resources, emit one collapsed **Azure Virtual Desktop** boundary node in the general diagram and connect that boundary to the shared resource. Do not expand the host pool behind it.

The AVD diagram shows the full internal topology and its shared-resource edges. Selection of that diagram is the only way to expand it.

## Tests

1. A host pool, workspace, application group, and session host are absent from the general diagram.
2. Those resources and their internal edges are present in the AVD diagram.
3. A session-host VM with no non-AVD role is absent from the general diagram.
4. A VM with a proven non-AVD role remains in the general diagram.
5. A cited AVD connection to a shared firewall produces one collapsed AVD boundary node, not the host-pool internals.
6. The data-flow projection also omits AVD-only internals.

## Acceptance criteria

- AVD isolation is view selection, not deletion of inventory data.
- Shared resources remain visible to both views.
- A collapsed boundary represents all hidden AVD internals for that connection.
- No data-flow hop or NSG annotation work in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once with `.\scripts\ci\agent-compile-check.ps1` on the affected test project.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

The general diagram stays free of AVD internals, and a reviewer can open one AVD diagram to see the complete desktop topology.
