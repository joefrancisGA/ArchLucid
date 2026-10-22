# DFV-23 — Paint Reads from and Writes to, and say when direction is still missing

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-16, DFV-17, DFV-20, DFV-21, or DFV-22 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. Prefer a package collected after DFV-22. Do not invent a direction the package does not contain.

## Goal

On **Data flow — what may connect**, a factory edge that came from a pipeline activity says **Reads from** or **Writes to**. When those edges exist, the canvas does not say pipeline direction was missing. When the package has factories and linked-service edges but no directional edges, the existing re-collect sentence stays.

## Why

`DiagramDataFlowHonestyLegend.PipelineDirectionMissingSentence` is the sentence the owner sees: **Pipeline direction was not in this package. Re-collect Azure inventory to see reads from / writes to.** `DiagramDataFlowCompileSupport` adds it when ingestion exists, an `adfLinkedService` or `adfLinkedServiceInferred` edge exists, and no `adfReadsFrom` or `adfWritesTo` edge is in the diagram.

`AzureInventoryAdfPipelineFlowEdgeMapper` already joins a flow row through dataset → linked service → target and writes those directional association types. `DiagramEdgeLabelHumanizer` already has the words **Reads from** and **Writes to**. This session makes that path obvious on the data-flow canvas and keeps the honesty sentence tied to the edges the reviewer can see.

A linked-service edge with no matching directional edge stays **Connected to** or **Likely connected to**. Do not relabel it.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramDataFlowCompileSupport.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramDataFlowHonestyLegend.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventoryAdfPipelineFlowEdgeMapper.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs`
- `docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md` (edge labels)

## What to build

1. Branch `dfv/23-paint-pipeline-direction` from current `master`.
2. On a data-flow canvas, an `adfReadsFrom` edge renders **Reads from**. An `adfWritesTo` edge renders **Writes to**. Synapse read and write association types use the same two labels.
3. When the included data-flow edges contain either directional type, do not add `PipelineDirectionMissingSentence`.
4. When ingestion and a linked-service edge are present and neither directional type is present, keep that sentence unchanged, including the re-collect clause.
5. Do not draw a pipeline node or a dataset node. Direction stays on the factory → store edge.
6. Other diagram types do not gain the sentence.
7. Tests:
    - A data-flow fixture with one `adfReadsFrom` edge and one linked-service edge does not contain `Pipeline direction was not in this package` and does contain `Reads from`.
    - A data-flow fixture with a linked-service edge and no directional edge still contains that sentence.
    - A `adfWritesTo` edge contains `Writes to`.
    - A Full subscription canvas does not contain the sentence.

## Acceptance criteria

- Directional edges are labeled Reads from or Writes to.
- The missing-direction sentence appears only when those edges are absent and linked-service edges are present.
- Linked-service edges keep their current labels.
- No new node types.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not change how flow rows are extracted. That is DFV-22.
- Do not collect observed traffic.
- Working-tree safety. Stage only the data-flow compiler, the label humanizer if the words are missing there, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DataFlow|FullyQualifiedName~EdgeLabel"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to open Data flow on a package that contains `adf-pipeline-flows.json` with Read and Write rows. Factory edges that resolved should say **Reads from** or **Writes to**, and the re-collect sentence should be gone. A package that still has only linked-service edges should keep the sentence. Wait for that look before any commit.
