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
        sqlNode.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence].Should().Be("0.7");
        sqlNode.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().NotBe(StructuredDiagramGraphProvenanceKinds.ObservedFact);
    }

    [Fact]
    public void Compile_asserted_nodes_keep_full_confidence_without_observed_fact_provenance()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API Gateway",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
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
                LabelOnlyInferenceConfidence = 0.35,
            });

        GraphNode apiNode = result.Snapshot.Nodes.Should().ContainSingle().Subject;
        apiNode.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence].Should().Be("1");
        apiNode.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.DeterministicInference);
        apiNode.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().NotBe(StructuredDiagramGraphProvenanceKinds.ObservedFact);
    }

    [Fact]
    public void Compile_label_only_confidence_is_clamped_below_one_even_when_options_are_invalid()
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
                LabelOnlyInferenceConfidence = 1.25,
            });

        GraphNode sqlNode = result.Snapshot.Nodes.Should().ContainSingle().Subject;
        double confidence = double.Parse(sqlNode.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence]);
        confidence.Should().BeLessThan(1d);
        confidence.Should().Be(StructuredDiagramLabelOnlyInferenceDefaults.StandardConfidence);
    }

    [Fact]
    public void Compile_corporate_network_subgraph_tags_member_nodes_as_trust_boundary()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Subgraphs =
            [
                new ArchitectureDiagramSubgraphRecord
                {
                    Id = "corp",
                    Label = "Corporate network",
                },
            ],
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    SubgraphId = "corp",
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

        result.Snapshot.Nodes.Should().ContainSingle(node => node.NodeType == GraphNodeTypes.TrustBoundary
            && node.Label == "Corporate network");
        GraphNode apiNode = result.Snapshot.Nodes.Single(node => node.SourceId == "api");
        apiNode.Properties[StructuredDiagramGraphPropertyKeys.TrustBoundaryLabel]
            .Should().Be("Corporate network");
        result.Snapshot.Edges.Should().ContainSingle(edge => edge.EdgeType == GraphEdgeTypes.Contains);
    }

    [Fact]
    public void Compile_legend_subgraph_does_not_create_trust_boundary_node()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Subgraphs =
            [
                new ArchitectureDiagramSubgraphRecord
                {
                    Id = "legend-lane",
                    Label = "Legend",
                },
            ],
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "color-key",
                    Label = "Blue = external",
                    SubgraphId = "legend-lane",
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

        result.Snapshot.Nodes.Should().NotContain(node => node.NodeType == GraphNodeTypes.TrustBoundary);
        GraphNode legendNode = result.Snapshot.Nodes.Should().ContainSingle().Subject;
        legendNode.Properties[StructuredDiagramGraphPropertyKeys.DiagramSubgraphLabel].Should().Be("Legend");
        legendNode.Properties.Should().NotContainKey(StructuredDiagramGraphPropertyKeys.TrustBoundaryLabel);
        result.Snapshot.Edges.Should().BeEmpty();
    }

    [Fact]
    public void Compile_three_unlabeled_rects_produce_zero_resource_nodes()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "rect-1",
                    Label = string.Empty,
                    Kind = ArchitectureDiagramNodeKinds.System,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "rect-2",
                    Label = "rect-2",
                    Kind = ArchitectureDiagramNodeKinds.System,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "rect-3",
                    Label = string.Empty,
                    Kind = ArchitectureDiagramNodeKinds.System,
                },
            ],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "e1",
                    SourceId = "rect-1",
                    TargetId = "rect-2",
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

        result.Snapshot.Nodes.Should().BeEmpty();
        result.Snapshot.Edges.Should().BeEmpty();
        result.UnlabeledShapeCount.Should().Be(3);
        result.Warnings.Should().ContainSingle()
            .Which.Should().Contain("NotVerifiable");
    }

    [Fact]
    public void Compile_bound_terraform_address_without_label_still_compiles_topology_node()
    {
        const string terraformAddress = "azurerm_sql_server.pay_sql";

        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = terraformAddress,
                    Label = string.Empty,
                    Kind = ArchitectureDiagramNodeKinds.System,
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

        result.UnlabeledShapeCount.Should().Be(0);
        result.Snapshot.Nodes.Should().ContainSingle(node => node.NodeId == $"diagram-node:{terraformAddress}");
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
