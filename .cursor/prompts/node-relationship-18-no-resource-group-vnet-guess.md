# NR-18 — A resource group is not a virtual network connection

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-19 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-05 and NR-17. Do not re-run NR-01 through NR-17. Do not edit the NR index.

## Goal

A workload with no stored network interface or virtual network path stays disconnected. Sharing a resource group with exactly one virtual network does not draw a line.

## Why

`AzureInventorySnapshotSameResourceGroupEdgeHydrator.AddSingleVnetPlacement` adds `inventory-rg-collocation` from a workload to the only virtual network in its resource group. That guess merges unrelated resources into one connected component. The owner rejected it.

The Data Factory and Key Vault guesses in the same class stay for NR-29. Do not remove them here.

## What to build

Stop emitting `GraphEdgeInferenceSources.InventoryResourceGroupCollocation`.

Delete `AddSingleVnetPlacement` and the helpers that exist only for that guess. Leave `AddDataFactoryStoreEdges` and `AddAppKeyVaultEdges` in place.

A resource that already has a stored interface, subnet, private endpoint, or other cited network edge keeps that edge. Collocation must not be required for it to stay connected.

Do not add a new inference source. Do not attach the workload to a virtual network by name similarity.

## Tests

1. A resource group with one virtual network and a virtual machine that has no network interface and no subnet reference produces no `inventory-rg-collocation` edge. The virtual machine is not connected to that virtual network.
2. The same virtual machine with a stored network interface path to that virtual network still has that stored edge.
3. A resource group with one Data Factory and one storage account still gets the existing inferred Data Factory edge. A resource group with one Key Vault and one app still gets the existing inferred Key Vault edge.

## Acceptance criteria

- Resource-group collocation no longer draws a line.
- A resource with no stored network path is disconnected.
- The Data Factory and Key Vault guesses are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the hydrator tests that cover same-resource-group edges.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A workload is connected to a virtual network only by a stored path, and the single-virtual-network resource-group guess is gone.
