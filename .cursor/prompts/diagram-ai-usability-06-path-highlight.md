# DAU-06 — Path highlight: trace X to Y on the compiled graph

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-05. **Do not** implement DAU-07–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

“How does App Service reach SQL?” highlights **one** visible path on the current `DiagramAst` / review model and dims the rest. Endpoint resolution may use Ask/labels; the path itself is **deterministic** graph search.

## Why

Neighborhood mode shows a star around a seed. Architects ask about *reachability between two named boxes*. Shortest path on visible edges is cheap, testable, and does not need an LLM layout.

## Context

- `ArchLucid.ArtifactSynthesis/Models/DiagramAst.cs`, `DiagramEdge.cs`, `DiagramEdgeVisibility.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramNeighborhoodSeedResolver.cs` — label/ARM/guid → node id
- Review model: `archlucid-ui/src/lib/architecture/architecture-diagram-types.ts`
- Viewer selection / camera: DAU-04 `focusNodeIds`
- Ask DiagramView (DAU-02) may supply two labels in the question

Do not use intended-reachability / SecureNow toxic-combination engines (different plane). This is **diagram-visible edges only**, honest about “no path on this view.”

## What to build

1. `DiagramVisiblePathFinder` (C#, own file) and a TS twin for the review model:
   - Input: node ids, visible (non-layout-only) undirected edges.
   - Output: ordered node ids + edge ids of a shortest path, or empty.
   - Do not traverse `IsLayoutOnly` `~~~` edges.
2. Endpoint resolver: map two strings through `DiagramNeighborhoodSeedResolver` / outline labels. 0 or >1 ambiguous matches without a unique id → insufficient, ask the operator to pick from the outline (no guessed ARM).
3. UI on inventory workbench (and review diagram if the model is in memory):
   - Controls: two inputs or “path from selection to…” using existing outline picker. Primary **Trace path**.
   - Highlight path edges/nodes via CSS class / Mermaid classDef **or** SVG class on Graphviz output — do not rewrite source topology.
   - Status: “No visible path on this view. Try Network mode or a neighborhood seed.” when empty.
4. Optional Ask: if question matches “how does X reach Y” / “path from X to Y”, return `ViewPlan` + `FitTargetNodeId` for the first endpoint **and** a new optional `PathEndpoints` pair on the response **only if** both resolve. Do not invent the path in prose without the finder result.
5. Tests: owner-shape triple has a path along the three VNets; layout-only `~~~` is not used; missing endpoint ⇒ empty.

## Acceptance criteria

- Tracing two peered VNets highlights that edge and those two nodes.
- Tracing disconnected isolates returns the honest empty status, not a fabricated arrow.
- Layout-only edges never appear as “architecture” path.

## Constraints

- Working-tree safety script before tracked edits.
- **Do not** add elk. **Do not** emit new visible `-->` to make a path exist.
- C# / TS each class in its own file. No `ConfigureAwait(false)` in tests.
- Verification:
  ```bash
  export PATH="$HOME/.dotnet:$PATH"
  dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramVisiblePathFinder'
  ```
  Plus focused Vitest for the UI helper.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
