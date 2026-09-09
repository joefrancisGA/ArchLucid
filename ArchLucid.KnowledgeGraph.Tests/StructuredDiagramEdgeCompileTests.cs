using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredDiagramEdgeCompileTests
{
    [Fact]
    public void Compile_connector_from_a_to_b_yields_diagram_origin_edge_with_citation()
    {
        ArchitectureDiagramModelRecord model = CreateTwoNodeModel(
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "e1",
                    SourceId = "api",
                    TargetId = "sql",
                    Label = "reads",
                },
            ],
            "evidence-diagram-1");

        StructuredDiagramGraphCompileResult result = Compile(model);
        GraphEdge edge = result.Snapshot.Edges.Should().ContainSingle().Subject;

        edge.FromNodeId.Should().Be("diagram-node:api");
        edge.ToNodeId.Should().Be("diagram-node:sql");
        edge.EdgeType.Should().Be(GraphEdgeTypes.ConnectsTo);
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.StructuredParse);
        edge.Properties[StructuredDiagramGraphPropertyKeys.DiagramOrigin].Should().Be("true");
        edge.Properties[StructuredDiagramGraphPropertyKeys.DiagramCitationRef]
            .Should().Be("diagram:evidence-diagram-1:e1");
        edge.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.DeterministicInference);
    }

    [Fact]
    public void Compile_ignores_style_only_edge_properties()
    {
        ArchitectureDiagramEdgeRecord connector = new()
        {
            Id = "e1",
            SourceId = "api",
            TargetId = "sql",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["strokeColor"] = "#ff0000",
                ["strokeWidth"] = "2",
                ["protocol"] = "https",
            },
        };

        StructuredDiagramGraphCompileResult result = Compile(CreateTwoNodeModel([connector], "evidence-1"));
        GraphEdge edge = result.Snapshot.Edges.Should().ContainSingle().Subject;

        edge.Properties.Should().NotContainKey("strokeColor");
        edge.Properties.Should().NotContainKey("strokeWidth");
        edge.Properties["protocol"].Should().Be("https");
    }

    [Fact]
    public void Compile_does_not_invent_reverse_edge()
    {
        ArchitectureDiagramModelRecord model = CreateTwoNodeModel(
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "forward",
                    SourceId = "api",
                    TargetId = "sql",
                },
            ],
            "evidence-1");

        StructuredDiagramGraphCompileResult result = Compile(model);

        result.Snapshot.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == "diagram-node:api" && edge.ToNodeId == "diagram-node:sql");
        result.Snapshot.Edges.Should().NotContain(edge =>
            edge.FromNodeId == "diagram-node:sql" && edge.ToNodeId == "diagram-node:api");
    }

    [Fact]
    public void Compile_deduplicates_duplicate_connectors_with_same_direction()
    {
        ArchitectureDiagramModelRecord model = CreateTwoNodeModel(
            [
                new ArchitectureDiagramEdgeRecord { Id = "e1", SourceId = "api", TargetId = "sql" },
                new ArchitectureDiagramEdgeRecord { Id = "e2", SourceId = "api", TargetId = "sql" },
            ],
            "evidence-1");

        StructuredDiagramGraphCompileResult result = Compile(model);

        result.Snapshot.Edges.Should().ContainSingle();
    }

    [Fact]
    public void Compile_diagram_edges_are_walkable_by_path_analyzer()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "Ingress",
                    Kind = ArchitectureDiagramNodeKinds.User,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "sql",
                    Label = "SQL",
                    Kind = ArchitectureDiagramNodeKinds.System,
                },
            ],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "e1",
                    SourceId = "api",
                    TargetId = "sql",
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
            SourceEvidenceItemId = "evidence-1",
        };

        StructuredDiagramGraphCompileResult compileResult = Compile(model);
        GraphNode actor = compileResult.Snapshot.Nodes.Single(node => node.SourceId == "api");
        actor.Properties["trustOrigin"] = nameof(TrustOrigin.External);

        GraphNode sql = compileResult.Snapshot.Nodes.Single(node => node.SourceId == "sql");
        sql.Properties["category"] = GraphTopologyCategories.Data;

        IReadOnlyList<DataFlowTrustBoundaryPath> paths = DataFlowTrustBoundaryPathAnalyzer.Analyze(compileResult.Snapshot);

        paths.Should().ContainSingle(path => path.DatastoreNodeId == "diagram-node:sql");
    }

    private static ArchitectureDiagramModelRecord CreateTwoNodeModel(
        IReadOnlyList<ArchitectureDiagramEdgeRecord> edges,
        string evidenceItemId)
    {
        return new ArchitectureDiagramModelRecord
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "sql",
                    Label = "SQL",
                    Kind = ArchitectureDiagramNodeKinds.System,
                },
            ],
            Edges = edges.ToList(),
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
            SourceEvidenceItemId = evidenceItemId,
        };
    }

    private static StructuredDiagramGraphCompileResult Compile(ArchitectureDiagramModelRecord model)
    {
        ArchitectureDiagramToGraphCompiler compiler = new();

        return compiler.Compile(
            model,
            new StructuredDiagramGraphCompileOptions
            {
                RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                GraphSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                CreatedUtc = DateTime.Parse("2026-01-01T00:00:00Z"),
            });
    }
}
