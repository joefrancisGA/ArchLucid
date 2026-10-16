# NR-40 — Link a Fabric capacity to workspaces assigned to it

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not treat a Fabric capacity as a data-flow hop. Do not infer a workspace from a name, a resource group, or collocation with Databricks or storage.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-04 and NR-05. The owner is looking at `hihapfabriccapacityprd` (`Microsoft.Fabric/capacities`) on the full subscription diagram. The outline says it stands alone. That name is not evidence of a workspace assignment.

## Goal

The next inventory capture stores each Fabric capacity workspace assignment that a documented admin API returns. When that workspace is already a node in the snapshot, draw one solid **Hosts** line from the capacity to that workspace. When assignments exist but the workspaces are not Azure resources in the snapshot, keep the capacity on the plate and record a completeness warning that names the count and one workspace display name. A capacity with no stored assignment stays unconnected.

## Why

`Microsoft.Fabric/capacities` is inventoried as an ARM resource. `InventoryDiagramOrphanedStateClassifier` treats a Fabric capacity with no cited edge as Unconnected. The outline renders that as `Stands alone`.

ARM on the capacity resource does not embed the workspace list. Workspace assignment is a Fabric admin fact, not resource-group membership. NR-04 named workspaces and managed private endpoints as the cited proof. Nothing collects them.

A workspace that is not an ARM resource in this snapshot must not become a invented diagram card. The reader still needs to see that the capacity is in use.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramDataFlowTraversalHopClassifier.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAksWorkloadImageCollectionWarnings.cs` (structured warning pattern)
- `archlucid-ui/src/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy.ts`
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` (where companion JSON files are written)

## What to build

1. Confirm the current documented Fabric admin list for workspaces on a capacity (Microsoft Learn Fabric REST admin capacities workspaces). Use that stable path. Do not invent an ARM child type. Do not call a preview API when Learn documents a stable one.
2. Add association type `fabricCapacityToWorkspace`. Evidence label **Current**. Diagram label **Hosts**. Inference source `inventory-fabric-capacity-workspace`. Reuse the existing association row and edge materializer.
3. Customer script and hosted extractor: for each `Microsoft.Fabric/capacities` resource, list assigned workspaces. Store `fromResourceId` = capacity ARM id, `toResourceId` = workspace id when the API returns an id, plus `workspaceDisplayName`. Write the rows to a companion file `fabric-capacity-assignments.json` and also emit association rows when `toResourceId` is non-empty.
4. On HTTP 401 or 403, emit one warning `fabric-capacity-assignments-not-collected:insufficient-permission:{capacityResourceId}`. On other failures, use `fabric-capacity-assignments-not-collected:{reason}:{capacityResourceId}` with a small closed reason set (`http-error`, `error`). Map those codes in the inventory completeness copy with remediation: the collector identity needs permission to list Fabric capacity workspace assignments (Fabric admin or the documented equivalent). Re-run collection and re-ingest.
5. When `toResourceId` matches a node in the snapshot, draw one solid **Hosts** edge. Two rows to the same workspace produce one edge.
6. When one or more assignments exist and none match a snapshot node, do not create workspace nodes. Add a completeness warning `fabric-capacity-workspaces-outside-inventory:{count}:{capacityResourceId}` and include one display name in the human copy. The capacity stays Unconnected on the plate. The warning is the explanation.
7. A capacity with zero assignments and no error stays Unconnected with no extra warning.
8. Keep Fabric capacity out of `InventoryDiagramDataFlowTraversalHopClassifier`.

Do not draw a line because the capacity name contains `fabric` or shares a resource group with storage or Databricks. Do not query Fabric item contents, lakehouse files, or Power BI datasets. Do not collect capacity SKU as a relationship.

Bump `scriptVersion` and `collectorVersion` in `Get-ArchLucidAzurePackage.ps1` and `Get-SecureNowAzurePackage.ps1` by one patch from the version already in those files.

## Tests

1. A capacity whose admin list returns one workspace id that is already a snapshot node emits one `fabricCapacityToWorkspace` row and one solid **Hosts** edge. The capacity is not Unconnected.
2. A capacity whose admin list returns workspaces that are not snapshot nodes emits no diagram node and no edge, and emits `fabric-capacity-workspaces-outside-inventory` with the count.
3. HTTP 403 on the admin list emits `fabric-capacity-assignments-not-collected:insufficient-permission` and does not invent a workspace.
4. A capacity named `hihapfabriccapacityprd` with an empty assignment list and no error stays Unconnected and does not link to resources in the same resource group.
5. Completeness copy for the insufficient-permission code names the capacity and tells the reader to grant Fabric assignment list permission, then re-collect.

Use fixture payloads. Do not call Fabric or Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests. Run the focused Pester file for the collector change.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure or Fabric.
- Do not re-run NR-01 through NR-39 as greenfield.

## Done when

After the next collection, `hihapfabriccapacityprd` has a **Hosts** line to each in-snapshot workspace the admin API cited, or a completeness warning that states the assignment count when those workspaces are outside this Azure inventory, or an insufficient-permission warning when the list call is forbidden. A capacity with no assignments and no error still stands alone. The current snapshot keeps the old result until that subscription is captured again.
