using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Diagram;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
public sealed class ArchitectureDiagramToGraphCompilerTests
{
    [Fact]
    public void Compile_maps_label_only_nodes_with_structured_parse_inference_not_observed_fact()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "sql",
                    Label = "SQL",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "e1",
                    SourceId = "api",
                    TargetId = "sql",
                    Label = "reads",
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult result = compiler.Compile(
            model,
            new StructuredDiagramGraphCompileOptions
            {
                RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                GraphSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                CreatedUtc = DateTime.Parse("2026-01-01T00:00:00Z"),
            });

        result.Warnings.Should().BeEmpty();
        result.Snapshot.Nodes.Should().HaveCount(2);
        result.Snapshot.Edges.Should().ContainSingle();

        GraphNode sqlNode = result.Snapshot.Nodes.Single(node => node.SourceId == "sql");
        sqlNode.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.DeterministicInference);
        sqlNode.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().NotBe("ObservedFact");
        sqlNode.SourceType.Should().Be(StructuredDiagramGraphSourceTypes.StructuredDiagram);

        result.Snapshot.Edges[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.StructuredParse);
        result.Snapshot.Edges[0].Weight.Should().BeLessThan(1d);
    }

    [Fact]
    public void Compile_empty_nodes_produces_empty_graph_snapshot()
    {
        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult result = compiler.Compile(
            new ArchitectureDiagramModelRecord(),
            new StructuredDiagramGraphCompileOptions
            {
                RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                GraphSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                CreatedUtc = DateTime.Parse("2026-01-01T00:00:00Z"),
            });

        result.Warnings.Should().BeEmpty();
        result.Snapshot.Nodes.Should().BeEmpty();
        result.Snapshot.Edges.Should().BeEmpty();
    }
}
