# IDP-01 — Carry provenance onto GraphEdge and DiagramEdge

**Wave:** inventory-diagram-provenance (**IDP**). **Depends on:** none (plumbing only). **Do not** implement IDP-02, IDP-03, IDP-04, dashes, legends, or label changes.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`ProvenanceKind` and `InferenceSource` that already exist on snapshot relationships must survive onto `GraphEdge` and `DiagramEdge`. Renderers keep today's solid gray `connects` / `depends on` appearance. This prompt is **design-neutral plumbing**.

## Why

Owner 2026-09-16: declared vs extract-derived connections look the same. The merger already stamps HumanAssertion + `human-declared-connection`. `AzureInventorySnapshotGraphResolver` copies `InferenceSource` and drops `ProvenanceKind`. `DiagramAstFromGraphCompiler` uses `InferenceSource` only inside `DiagramEdgeLabelHumanizer.ResolveDisplayLabel` and does not store it. No renderer can distinguish the edges until this hop exists.

## Context

- `ArchLucid.Contracts/Persistence/Graph/GraphEdge.cs` — SchemaVersion 1; **additive optional fields only** (do not bump schema)
- `ArchLucid.Core/Persistence/Serialization/GraphEdgeJsonConverter.cs` + `ArchLucid.Core.Tests/Persistence/Serialization/GraphEdgeJsonConverterTests.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs`
- `ArchLucid.ArtifactSynthesis/Models/DiagramEdge.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` (~62–78)
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs` (`HumanDeclaredConnection = "human-declared-connection"`)
- `ArchLucid.Core/InfraEvidence/ProvenanceKind.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecurityDeclaredConnectionSnapshotMergerTests.cs` (relationship stamps — keep green)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs`

`GraphEdge` lives in Contracts. Do **not** add a project reference from Contracts to Core for the `ProvenanceKind` enum. Store the kind as `string?` (enum name: `HumanAssertion`, `ObservedFact`, …).

## What to build

1. `GraphEdge`: add optional `string? ProvenanceKind { get; set; }`. XML-doc: additive SchemaVersion 1 field; missing JSON deserializes as null.
2. `GraphEdgeJsonConverter`:
   - Read `provenanceKind` (missing/null → null).
   - Write the property: null → JSON null (same pattern as `inferenceSource`).
   - Existing snapshots without the field still deserialize.
3. `AzureInventorySnapshotGraphResolver` edge construction (~173–182): set `ProvenanceKind = relationship.ProvenanceKind.ToString()`. Keep existing `InferenceSource` copy. Do not change `Weight` rules.
4. `DiagramEdge`: add optional `string? ProvenanceKind` and `string? InferenceSource`. Do not add dash/color fields.
5. New class (own file) `ArchLucid.ArtifactSynthesis/DiagramEdgeVisualKind.cs`:
   - Enum: `Observed`, `Declared`, `AiInferred`.
   - Static resolver `DiagramEdgeVisualKindResolver.From(string? provenanceKind, string? inferenceSource)`:
     - `Declared` when provenance is `HumanAssertion` **or** inference equals `GraphEdgeInferenceSources.HumanDeclaredConnection` (ordinal ignore case).
     - `AiInferred` when provenance is `AiInference`.
     - Otherwise `Observed` (includes null, ObservedFact, DerivedFact, DeterministicInference, inventory-* inference).
   - **Do not call this from renderers in this prompt.** Tests only. IDP-02 wires paint.
6. `DiagramAstFromGraphCompiler` when adding a `DiagramEdge` from a `GraphEdge`:
   - Copy `ProvenanceKind` and `InferenceSource`.
   - Keep today's `Label = DiagramEdgeLabelHumanizer.ResolveDisplayLabel(...)` — **no `declared` prefix**.
   - Layout-only edges created later stay without provenance (null).
   - Executive peering builders that construct `DiagramEdge` directly: leave provenance null unless the source `GraphEdge` is in hand; do not invent HumanAssertion.
7. Tests (fail on current code, pass after):
   - Resolver: HumanAssertion → Declared; `human-declared-connection` without kind → Declared; ObservedFact + `inventory-nic-subnet` → Observed; AiInference → AiInferred; null/null → Observed.
   - Graph resolver: a snapshot relationship with HumanAssertion + `human-declared-connection` produces a `GraphEdge` with both fields set.
   - Compiler: that graph edge becomes a `DiagramEdge` with both fields set and label still the humanized verb (`connects` / `depends on`), **not** containing `declared`.
   - Converter: JSON without `provenanceKind` round-trips; JSON with `"provenanceKind":"HumanAssertion"` round-trips.
8. No forest/Mermaid/Graphviz/UI edits. No OpenAPI. No SQL.

## Acceptance criteria

- A merged declared connection still looks like inventory `connects` on every renderer (this prompt does not paint).
- `DiagramEdge` for that connection has `ProvenanceKind = "HumanAssertion"` and `InferenceSource = "human-declared-connection"`.
- Inventory NIC→subnet (or equivalent) edges keep ObservedFact / `inventory-*` and are `Observed`.
- Missing `provenanceKind` on old graph JSON does not throw.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** emit `-.->`, `stroke-dasharray`, `style=dashed`, or legend copy. **Do not** change `DiagramEdgeLabelHumanizer` output. **Do not** bump `GraphSnapshot.SchemaVersion`.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification:
  - `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~DiagramEdgeVisualKind'`
  - `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AzureInventorySnapshotGraphResolver|FullyQualifiedName~SecurityDeclaredConnectionSnapshotMergerTests'`
  - `dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~GraphEdgeJsonConverterTests'`
  - Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
