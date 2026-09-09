using ArchLucid.ContextIngestion;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Builders;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     AS-016: structured diagram canonical objects compile into review-graph topology before finding engines run.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredDiagramAuthorityPipelineGraphTests
{
    [Fact]
    public async Task BuildAsync_MermaidCanonicalObjects_ProducesDiagramTopologyNodesWithStructuredParseEdges()
    {
        const string mermaid = """
            flowchart LR
                api["API Gateway"]
                db["SQL Database"]
                api -->|"queries"| db
            """;

        MermaidContextDocumentParser parser = new();
        ContextDocumentReference document = new()
        {
            DocumentId = "doc-mermaid-fixture",
            Name = "topology.mmd",
            ContentType = SupportedContextDocumentContentTypes.Mermaid,
            Content = mermaid,
        };

        IReadOnlyList<CanonicalObject> canonicalObjects = await parser.ParseAsync(document, CancellationToken.None);

        DefaultGraphBuilder builder = GraphMaterializationTestHelpers.CreateDefaultGraphBuilder(
            new GraphNodeFactory(),
            new DefaultGraphEdgeInferer());

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            RunId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            ProjectId = "project-mermaid",
            CanonicalObjects = [.. canonicalObjects],
        };

        GraphBuildResult result = await builder.BuildAsync(snapshot, CancellationToken.None);

        result.Nodes.Should().Contain(node =>
            node.NodeId == "diagram-node:api"
            && node.NodeType == GraphNodeTypes.TopologyResource);

        result.Nodes.Should().Contain(node =>
            node.NodeId == "diagram-node:db"
            && node.NodeType == GraphNodeTypes.TopologyResource);

        result.Nodes.Should().NotContain(node =>
            node.NodeId.StartsWith("obj-", StringComparison.Ordinal)
            && canonicalObjects.Any(obj => node.NodeId == $"obj-{obj.ObjectId}"));

        result.Edges.Should().Contain(edge =>
            edge.FromNodeId == "diagram-node:api"
            && edge.ToNodeId == "diagram-node:db"
            && edge.InferenceSource == GraphEdgeInferenceSources.StructuredParse);

        result.Edges.Should().NotContain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.TopologyConnectsTo
            && edge.FromNodeId.StartsWith("diagram-node:", StringComparison.Ordinal));
    }

    [Fact]
    public async Task BuildAsync_PixelOnlyStubCanonicalObjects_DoesNotAddDiagramTopologyNodes()
    {
        DefaultGraphBuilder builder = GraphMaterializationTestHelpers.CreateDefaultGraphBuilder(
            new GraphNodeFactory(),
            new DefaultGraphEdgeInferer());

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
            RunId = Guid.Parse("22222222-3333-4444-5555-666666666666"),
            ProjectId = "project-pixel-stub",
            CanonicalObjects = [],
        };

        GraphBuildResult result = await builder.BuildAsync(snapshot, CancellationToken.None);

        result.Nodes.Should().ContainSingle(node => node.NodeType == GraphNodeTypes.ContextSnapshot);
        result.Nodes.Should().NotContain(node => node.NodeId.StartsWith("diagram-node:", StringComparison.Ordinal));
        result.Edges.Should().BeEmpty();
    }

    [Fact]
    public async Task StructuredDiagramGraphCompileStage_skips_when_no_structured_diagram_objects()
    {
        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000000"),
            RunId = Guid.NewGuid(),
            ProjectId = "project-empty",
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = "cmp-1",
                    ObjectType = GraphNodeTypes.TopologyResource,
                    Name = "api",
                    SourceType = "InfrastructureDeclaration",
                    SourceId = "decl-1",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
            ],
        };

        GraphMaterializationContext context = new(snapshot, []);
        GraphMaterializationPipeline pipeline = GraphMaterializationTestHelpers.CreateDefaultPipeline(new GraphNodeFactory());
        GraphMaterializationPipelineOptions options = new() { StopAfterStageName = "structured-diagram-graph-compile" };

        GraphMaterializationRunResult runResult = await pipeline.RunAsync(context, CancellationToken.None, options);

        runResult.StageOutcomes.Should().ContainSingle(stage =>
            stage.StageName == "structured-diagram-graph-compile"
            && stage.Skipped
            && stage.NodesAdded == 0);
    }
}
