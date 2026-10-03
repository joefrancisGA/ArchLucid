# DFV-06 — Say who uses each data store

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-07, DFV-08, or DFV-09 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. DFV-01 through DFV-05 are already there. Do not redo routing, the fan-out filter, or the icon map.

## Goal

On **Data flow — what may connect**, every storage account and database card says either who is connected to it or that no consumer was found. A card with no line is no longer silent.

## Why

`Hmd_HI_HAP_Non_Prod` draws many storage accounts with no connector. A reviewer cannot tell a real orphan from a card the diagram never checked.

`InventoryDiagramOrphanedStateApplier` already sets `ConnectionState`. For a storage account with no cited edge it falls through to `Unknown`, and `ConnectionStateMessage` stays null. `DiagramForestCanvasLabelContext` paints `NameLines` and `ResourceGroupLines` only. The word Unknown never appears, and it would be the wrong word if it did. NR-12 explains Unknown in the outline. This prompt is the card on the data-flow canvas.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeMetrics.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramOrphanedStateApplier.cs` — read only
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` (`BuildTitle`, data-flow edge filter)

## What to build

1. Branch `dfv/06-consumer-status` from current `master`.
2. On a data-flow canvas only (`Azure inventory (DataFlow)`), paint one short line under the resource name for these ARM types:
   - `Microsoft.Storage/storageAccounts`
   - `Microsoft.Sql/servers`
   - `Microsoft.Sql/servers/databases`
   - `Microsoft.Sql/managedInstances`
   - `Microsoft.DBforMySQL/servers`
   - `Microsoft.DBforMySQL/flexibleServers`
   - `Microsoft.DBforPostgreSQL/servers`
   - `Microsoft.DBforPostgreSQL/flexibleServers`
   - `Microsoft.DocumentDB/databaseAccounts`
   - `Microsoft.Cache/Redis` and `Microsoft.Cache/redis`
3. Count the other ends of non-layout edges whose endpoints are both on the canvas. The line is `Used by 1` or `Used by N`. Zero edges: `No consumer found`.
4. Do not paint `Unknown`, `Orphaned`, or `Unconnected` on these cards. Leave `ConnectionState` and the Mermaid `al-state` comment as they are. Do not change NR-12.
5. Do not put this line on factories, Logic Apps, linked services, firewalls, or NAT gateways.
6. Give the card enough height for the extra line. Resource-group lines stay under it. If a type line is already painted, put this status under that type line. Do not remove the type line.
7. Tests: a storage account with one edge to a factory renders `Used by 1`. A storage account with no edges renders `No consumer found`. A Logic App on the same canvas does not render either phrase. A Full subscription title does not render either phrase.

## Acceptance criteria

- Every listed data store on Data flow has exactly one of those two lines.
- Unconnected stores stay on the canvas.
- Diagnostic-setting edges stay off Data flow. They do not count as consumers.
- Other diagram types look the same as before.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not add a side panel, a new collector, or config-file upload.
- Working-tree safety. Stage only the layout files and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~DiagramForest
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open Data flow on `Hmd_HI_HAP_Non_Prod`. A storage account with a connector should say `Used by N`. A storage account with no connector should say `No consumer found`. Factories and linked services should not gain that line. Wait for that look before any commit.
