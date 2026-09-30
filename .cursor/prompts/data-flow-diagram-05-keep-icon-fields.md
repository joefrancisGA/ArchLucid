# DFV-05 — Keep linked-service icons through diagram repair

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement another DFV in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. DFV-03 is already merged (PR 4128). Do not redo the icon map.

## Goal

On **Data flow — what may connect**, an external linked service keeps the official icon DFV-03 mapped, after the diagram is repaired for layout. A Function App keeps the Function Apps mark. An access connector, a Fabric capacity, and a Logic App API connection stay category pictograms.

## Why

PR 4128 taught `DiagramInventoryAzureIconResolver` to read `DiagramNode.ExternalLinkedServiceType`. `DiagramAstFromGraphCompiler.BuildDiagramNode` sets that field, and `ArmResourceKind`, on the compiled AST.

The canvas does not paint that AST.

`MermaidDiagramRenderPipeline.RenderAsync` calls `MermaidDiagramDeterministicRepairer.Repair`, then stores the result as `RepairedAst`. `InfraEvidenceSnapshotMermaidService.TryRenderInventoryLayoutAsync` lays out `renderResult.RepairedAst` with `DiagramForestLayoutSvgRenderer`.

`Repair` builds a new `DiagramNode` and copies `NodeId`, `Label`, `NodeType`, `SubgraphId`, `OrderKey`, `CloudResourceId`, `SeedNodeId`, `ArmResourceType`, and `ArmResourceGroup`. It leaves `ExternalLinkedServiceType` and `ArmResourceKind` null.

`Renderer_emits_linked_service_icons_and_keeps_access_connector_pictogram` calls the forest renderer on the compiled node. It never calls `Repair`. That test stays green while the live diagram still draws the blue compute pictogram for `azureblob`, `azuremysql1`, and `sftp_ahcccs`.

The same constructor drops every other painter field. `ArmResourceKind` is how `Microsoft.Web/sites` with kind `functionapp` resolves to Function Apps. Without it, `AzureArchitectureIconCatalog.Resolve` returns the kind-less App Services row. `HasPrivateEndpointAccess`, caption details, the AVD boundary flag, and the NSG fields on `DiagramEdge` are dropped the same way. VN-12 already had to put `InferenceSource` back onto repaired edges for this reason.

## Read first

- `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`
- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramDeterministicRepairer.cs`
- `ArchLucid.ArtifactSynthesis/Models/DiagramNode.cs`
- `ArchLucid.ArtifactSynthesis/Models/DiagramEdge.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryAzureIconResolver.cs`
- `ArchLucid.ArtifactSynthesis/Layout/AzureArchitectureIconCatalog.cs` (`Resolve`)
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs` (`TryRenderInventoryLayoutAsync`)
- `ArchLucid.ArtifactSynthesis.Tests/AzureArchitectureIconCatalogTests.cs` (`Renderer_emits_linked_service_icons_and_keeps_access_connector_pictogram`)

## What to build

1. Branch `dfv/05-keep-icon-fields` from current `master`.
2. When `Repair` copies a node, keep the sanitizer and the label truncation. Also copy:
   - `ArmResourceId`
   - `ArmResourceKind`
   - `ExternalLinkedServiceType`
   - `IncludeResourceGroupInCaption`
   - `HasPrivateEndpointAccess`
   - `IsExecutiveOverflow`
   - `IsUnresolvedPolicyOutlineOnly`
   - `ParentAttachmentDetails` as a new list
   - `ConnectionState`
   - `ConnectionStateMessage`
   - `UnresolvedRelationshipDetails` as a new list
   - `IsAvdCollapsedBoundary`
   - `DataFlowTraversalHopEvidenceDetails` as a new list
3. When `Repair` copies an edge, keep the fields it already copies. Also copy:
   - `DeclaredConnectionId`
   - `IsDataFlowNsgBlocked`
   - `DataFlowNsgAnnotationLabels` as a new list
   - `DataFlowNsgSupportingRuleDetails` as a new list
4. Do not change duplicate-node or duplicate-edge collapsing. The node that is kept must carry these fields. Do not change icon files, the manifest, or `LinkedServiceIconFiles`.
5. Tests in `ArchLucid.ArtifactSynthesis.Tests`:
   - Repair a node whose id needs no sanitizing, with `ExternalLinkedServiceType` `AzureBlobStorage` and `ArmResourceKind` `functionapp`, then render that repaired AST with `DiagramForestLayoutSvgRenderer`. The SVG contains `data-file="Svg/storage-account.svg"`.
   - The same path for `AzureMySql` contains `data-file="Svg/mysql.svg"`. For `Sftp` it contains `data-file="Svg/resource-linked.svg"`.
   - Repair then render one node: `ArmResourceType` `Microsoft.Web/sites`, `ArmResourceKind` `functionapp`. The SVG contains `data-file="Svg/function-app.svg"` and does not contain `data-file="Svg/app-service.svg"`.
   - Repair then render `Microsoft.Databricks/accessConnectors` with no linked-service type. The SVG contains `class="pictogram"` and does not contain `data-file="Svg/databricks.svg"`.
   - One node with every `DiagramNode` property set to a non-default value, and one edge with the NSG fields set. After `Repair`, each copied property equals the source. Copied lists are equal and are not the same instance.
   - `Renderer_emits_linked_service_icons_and_keeps_access_connector_pictogram` stays green. It is not a substitute for the repair tests.

## Acceptance criteria

- After repair, `azureblob` draws Storage Accounts, `azuremysql1` draws Azure Database for MySQL, and an SFTP linked service draws Resource Linked.
- A Function App draws Function Apps, not App Services.
- Access connectors, Fabric capacities, and Logic App connections (`Microsoft.Web/connections`) stay pictograms. Do not add icon files for them.
- Sanitized node ids, truncated labels, and collapsed duplicates behave as they do today.
- No new SVG files. No change to the evidence catalog, edge router, or caption disclosure.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not download icons. Do not edit the July 2026 zip.
- Working-tree safety. Stage only the repairer and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~MermaidDiagramDeterministicRepairer|FullyQualifiedName~AzureArchitectureIcon"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open **Data flow — what may connect** on `Hmd_HI_HAP_Non_Prod`. `azureblob` should show the storage-account mark. `azuremysql1` should show the MySQL mark. `hsag_sftp` and `nucc_http` should show Resource Linked. A Function App should show the Function Apps mark, not the App Service mark. `unity-catalog-access-connector` and `hihapfabriccapchynprd` should still be category pictograms. Wait for that look before any commit.
