# NR-46 — Say when connection posture is not modeled

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a workspace, backend, or subnet from a name or a resource group.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-05, NR-11, and NR-12. The owner is looking at outline rows whose type is Components or Service. Those labels are the last ARM segment of `Microsoft.Insights/components` and `Microsoft.ApiManagement/service`. The problem column says `Connection state was not classified.`

## Goal

Those two types, when they have no cited edge, stay on the diagram and are not called Stands alone. The outline says `Connection posture is not modeled for this resource type.` `Connection state was not classified.` remains only for a node whose type has a classifier rule that still could not decide. Do not draw an Application Insights or API Management edge in this session.

## Why

Unknown means the classifier looked and did not decide. Application Insights components and API Management services have no connection-state rule and are not shared services. Every lineless instance falls through `InventoryDiagramOrphanedStateApplier` to Unknown, and `resolveNodeProblem` returns `Connection state was not classified.` before it reads unresolved details.

NR-12 already required a reason on an Unknown row. These two types have a known reason: posture is not modeled. Calling them Stands alone would claim that having no edge is a normal posture. That decision is not made here.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramOrphanedStateApplier.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx` (`resolveNodeProblem`)
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts`
- `.cursor/prompts/node-relationship-12-unknown-questions.md`

## What to build

1. Add a closed catalog containing only `Microsoft.Insights/components` and `Microsoft.ApiManagement/service`.
2. When a node of one of those types has no cited edge and is not Orphaned or Used, set unresolved detail `Connection posture is not modeled for this resource type.` Keep the connection state Unknown so the ledger still has a place for it. Do not add a new connection-state enum value.
3. In the outline problem column, when `connectionState` is Unknown and unresolved details are non-empty, show those details. Show `Connection state was not classified.` only when that list is empty.
4. The node caption uses the same detail sentence for these two types.
5. Do not add either type to `InventoryDiagramSharedServiceCatalog`. Do not classify them Unconnected.
6. Do not collect Application Insights workspace links, API Management backends, or private endpoints in this session. A later prompt may draw those edges. A name match is not a link.
7. Do not change Data Factory or Logic App connection classification. NR-44 and NR-45 own those sentences.

Do not bump `scriptVersion`. Do not call Azure.

## Tests

1. An Application Insights component with no edges shows `Connection posture is not modeled for this resource type.` It does not show `Stands alone` or `Connection state was not classified.`
2. An API Management service with no edges shows the same sentence.
3. An Unknown node of a type this catalog does not list, with an empty unresolved-detail list, still shows `Connection state was not classified.`
4. An Unknown node that already has an unresolved detail shows that detail in the problem column.
5. A shared-service type with no edge stays Unconnected under the existing catalog.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-45 as greenfield.

## Done when

Components and Service rows no longer say the connection state was not classified. They say the posture is not modeled. Other Unknown rows keep the generic sentence only when they still have no reason. No new line is drawn.
