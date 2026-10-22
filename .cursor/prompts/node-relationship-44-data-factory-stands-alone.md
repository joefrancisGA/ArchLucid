# NR-44 — A Data Factory with no stored link stands alone

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a factory link from a name, a resource group, or a `df` substring.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-05, NR-11, and NR-29. The owner is looking at factories such as `adf-edw-hi-dev-readonly`. The outline type is Data Factory. The problem column says `Connection state was not classified.` The factory has no cited diagram edge.

## Goal

A `Microsoft.DataFactory/factories` node with no cited edge is Unconnected. The outline says `No stored Data Factory link yet.` It must not say `Connection state was not classified.` A factory that already has a stored linked-service, pipeline, or NR-29 **Likely** edge stays Connected. Do not add a new edge in this session.

## Why

`InventoryDiagramOrphanedStateClassifier` returns a definite state only for a closed set of types. Storage with no link is Unconnected and carries `No stored storage link yet.` A factory is not in that set and is not a shared service. `InventoryDiagramOrphanedStateApplier` then sets `ConnectionState` to Unknown. The outline prints `Connection state was not classified.`

NR-29 already draws a dashed **Likely** line when a resource-group guess is allowed, and that line counts as cited. This session does not add another guess. A factory that still has no edge has no stored proof and no NR-29 line. That is Unconnected, not Unknown.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramOrphanedStateApplier.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx` (`resolveNodeProblem`)
- `.cursor/prompts/node-relationship-33-storage-connectivity.md`
- `.cursor/prompts/node-relationship-29-likely-lines.md`

## What to build

1. When the ARM type is `Microsoft.DataFactory/factories`, the node has no cited edge, and the classifier does not return Orphaned, return Unconnected with unresolved detail `No stored Data Factory link yet.`
2. Do not add Data Factory to `InventoryDiagramSharedServiceCatalog`.
3. Do not draw a linked-service, pipeline, or **Likely** edge in this session. If one already exists, the applier's cited-edge path stays Connected and this detail is not applied.
4. A factory whose linked-service collection warning is already on the snapshot stays Unconnected when no edge was drawn. Do not hide that warning. Do not invent a link to clear the warning.
5. The outline problem column shows the unresolved detail, not `Connection state was not classified.`
6. The caption path uses the same sentence. Do not leave the caption on Unknown while the outline says the new sentence.
7. Do not change storage, registry, Logic App, Application Insights, or API Management classification in this session.

Do not query Data Factory, do not read linked-service payloads again, and do not bump `scriptVersion`.

## Tests

1. A factory node with no edges is Unconnected. Caption and outline problem text contain `No stored Data Factory link yet.` They do not contain `Connection state was not classified.`
2. A factory with one stored linked-service edge to a snapshot node stays Connected and does not gain that sentence.
3. A storage account with no link still uses `No stored storage link yet.` and stays Unconnected.
4. A resource type this session does not name still falls through to Unknown when it has no edge and no other rule.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-43 as greenfield.

## Done when

A Data Factory with no cited edge stands alone and the outline names the missing stored link. A factory that already has a stored or NR-29 line stays connected. No new line appears because of a name or a resource group.
