# DFV-07 — Name the type on every data-flow card

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-06, DFV-08, or DFV-09 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. Do not redo DFV-01 through DFV-05.

## Goal

On **Data flow — what may connect**, every card shows a short type under its name. A Logic App connection, a Fabric capacity, an access connector, and a Function App are readable without opening the outline. Cards in the **Not staged** column show that same type line.

## Why

`DiagramArmTypeFriendlyName` already knows Fabric capacity and MySQL. `DiagramNodeHumanCaptionFactory` builds `TypeCaption`, then `DiagramForestCanvasLabelContext` paints only the resource name. The canvas therefore shows `office365`, `unity-catalog-access-connector`, and `hihapfabriccapchynprd` with no type.

`Microsoft.Web/sites` with kind `functionapp` currently formats as App Service, because `TryFormat` ignores kind. An external linked service has ARM type `TopologyResource`, which must not paint as "Topology resource".

`DiagramForestDataFlowColumnLayout` puts a node in **Not staged** when `SubgraphId` is null. Those cards need a type more than the others.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramArmTypeFriendlyName.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs`
- `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`

## What to build

1. Branch `dfv/07-type-captions` from current `master`.
2. On a data-flow canvas, paint the type as a line under the name and above any resource-group line. Grow the card to fit it. If the card already says `Used by N` or `No consumer found`, keep that line under the type line.
3. Use these phrases. Do not invent a longer sentence:
   - `Microsoft.Web/connections` → `Logic App connection`
   - `Microsoft.Databricks/accessConnectors` → `Access connector`
   - `Microsoft.Fabric/capacities` → `Fabric capacity`
   - `Microsoft.Web/sites` with kind `functionapp` → `Function App`
   - `Microsoft.Web/sites` with any other kind → `App Service`
   - External linked service `AzureBlobStorage` or `AzureBlobFS` → `Blob link`
   - `AzureMySql` → `MySQL link`
   - `Sftp` → `SFTP link`
   - `HttpServer`, `Web`, or `RestService` → `HTTP link`
   - Any other `ExternalLinkedServiceType` → `{type} link`
4. When `ExternalLinkedServiceType` is set, paint that phrase and do not paint `Topology resource`.
5. Leave the **Not staged** column title as it is. Every card in it still gets its type line. Do not assign those cards a fake Source or Storage stage.
6. Do not add icon files. Access connectors and Fabric capacities stay pictograms.
7. Tests: a data-flow SVG contains `Logic App connection`, `Access connector`, `Fabric capacity`, `Function App`, and `MySQL link` on the matching nodes. A Function App node does not contain the type line `App Service`. An external node does not contain `Topology resource`. A Full subscription canvas does not gain these type lines.

## Acceptance criteria

- Data flow cards show name, then type.
- Not staged cards are identifiable by type.
- Full, Network, and Executive canvases do not gain this second line.
- No new SVG files.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not download icons. Do not borrow the Databricks workspace icon.
- Working-tree safety. Stage only the caption, layout, and test files. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForest|FullyQualifiedName~DiagramArmTypeFriendlyName"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open Data flow on `Hmd_HI_HAP_Non_Prod`. `office365` should read as a Logic App connection. `unity-catalog-access-connector` should read as an access connector. `hihapfabriccapchynprd` should read as a Fabric capacity. A function app should not read as App Service. Wait for that look before any commit.
