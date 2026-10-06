# NR-29 — A resource-group guess is a dashed Likely line

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-30 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-18. Do not re-run NR-01 through NR-28. Do not edit the NR index. Do not collect new Azure data. NR-31 does that.

## Goal

The Data Factory guess and the app-to-Key-Vault guess draw a dashed line labeled **Likely**. The outline says `No stored link yet; inferred from resource group.` The line still joins those resources into one connected component.

## Why

`AzureInventorySnapshotSameResourceGroupEdgeHydrator` links every Data Factory to the only store in the resource group, and every app to the only Key Vault, with no stored linked service or Key Vault reference. The owner wants those guesses visible and obvious, not removed and not drawn as proven.

A stored Data Factory linked service, and a stored app-setting reference that already uses `InventoryAppKeyVaultRef` from `AzureInventoryAppSettingHostEdgeMapper`, are proof. They stay solid.

## What to build

Only the two guesses from `AddDataFactoryStoreEdges` and `AddAppKeyVaultEdges`:

- Display label **Likely**.
- The painted line is dashed. Reuse the existing `likely ·` paint path (`DiagramCrossGroupFanOutCanvasExclusion` and the forest renderer) if it already dashes a line. Do not add a second dash style.
- These lines stay on the plate when cross-group fan-out is hidden. They are not optional fan-out.
- The outline row for each such line is `No stored link yet; inferred from resource group.`
- They remain diagram edges, so the plate component count includes them. Do not drop them in `AzureInventorySnapshotCitedEdgePolicy` if that would remove the line. They are still not proof that a resource is Connected. A resource whose only line is **Likely** stays **Unknown** or **Unconnected** under the NR-11 rules, and the outline question explains the guess.

Do not change a linked-service edge that came from collected Data Factory rows. Do not change an app-setting Key Vault reference that was actually read.

Do not remove the guesses. NR-18 already removed only the virtual-network collocation guess.

## Tests

1. One Data Factory and one storage account in a resource group, with no linked-service row, produce a dashed line labeled `Likely` and the outline sentence `No stored link yet; inferred from resource group.`
2. One app and one Key Vault, with no stored reference, do the same.
3. A collected Data Factory linked service to a storage account stays a solid line and does not use that outline sentence.
4. Two storage accounts in the group still produce no Data Factory guess. The existing single-store condition remains.

## Acceptance criteria

- The two resource-group guesses are dashed **Likely** lines.
- The outline states that no stored link exists yet.
- A collected linked service is not relabeled as a guess.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new Likely tests and the existing same-resource-group hydrator tests.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A Data Factory or Key Vault line that was inferred from the resource group is dashed and explained, and a collected link is not.
