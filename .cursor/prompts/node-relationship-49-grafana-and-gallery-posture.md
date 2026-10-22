# NR-49 — Grafana and compute galleries are not modeled

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a workspace, data source, image version, or virtual machine from a name such as `grafana hi nprd` or `gal_img_vdi`.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-05, NR-11, NR-12, and NR-46. The owner is looking at `grafana hi nprd` (type Grafana) and `gal_img_vdi` / `gal_img_nprd_vdi` (type Galleries). The problem column says `Connection state was not classified.`

## Goal

`Microsoft.Dashboard/grafana` and `Microsoft.Compute/galleries` nodes with no cited edge stay on the diagram and are not called Stands alone. The outline says `Connection posture is not modeled for this resource type.` `Connection state was not classified.` remains only when a type with a classifier rule still could not decide. Do not draw a Grafana or gallery edge in this session.

## Why

NR-46 already says this for Application Insights and API Management. These two types are the same kind of gap. `InventoryDiagramIndirectRelationshipClassifier` looks for `managedGrafana`, which does not match `Microsoft.Dashboard/grafana`, so Azure Managed Grafana falls through to Unknown. A compute gallery (`Microsoft.Compute/galleries`) has no connection-state rule. Calling either Stands alone would claim that having no edge is a normal posture. That decision is not made here.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramConnectionPostureCatalog.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramIndirectRelationshipClassifier.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramOrphanedStateApplier.cs`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx` (`resolveNodeProblem`)
- `.cursor/prompts/node-relationship-46-unmodeled-connection-posture.md`

## What to build

1. Add only `Microsoft.Dashboard/grafana` and `Microsoft.Compute/galleries` to `InventoryDiagramConnectionPostureCatalog`. Keep the existing Application Insights and API Management entries.
2. When one of those nodes has no cited edge and is not Orphaned or Used, set unresolved detail `Connection posture is not modeled for this resource type.` Keep connection state Unknown. Do not add an enum value.
3. The outline already shows unresolved details for Unknown. Do not change that rule except to cover these types.
4. The caption uses the same detail sentence and does not also say `Connection state was not classified.`
5. Do not add either type to `InventoryDiagramSharedServiceCatalog`. Do not classify them Unconnected.
6. Leave the existing `managedGrafana` indirect match unchanged. Do not collect Grafana data sources or gallery image versions.
7. Do not change private link scopes, NAT gateways, or access connectors. NR-47, NR-48, and NR-50 own those.

Do not call Azure. Do not bump `scriptVersion`.

## Tests

1. A `Microsoft.Dashboard/grafana` node with no edges shows `Connection posture is not modeled for this resource type.` It does not show `Stands alone` or `Connection state was not classified.`
2. A `Microsoft.Compute/galleries` node with no edges shows the same sentence.
3. An Application Insights component still shows that sentence.
4. An Unknown node whose type is not in the catalog and whose unresolved-detail list is empty still shows `Connection state was not classified.`

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-48 as greenfield.

## Done when

Grafana and Galleries rows no longer say the connection state was not classified. They say the posture is not modeled. No new line is drawn.
