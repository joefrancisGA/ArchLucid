using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class RequestAssumptionEdgeMaterializerTests
{
    [Fact]
    public void Materialize_links_assumption_to_requirement_when_label_tokens_overlap()
    {
        GraphNode assumption = CreateAssumption("assumption-1", "Private endpoints required for payment API");
        GraphNode requirement = new()
        {
            NodeId = "req-payment",
            NodeType = GraphNodeTypes.Requirement,
            Label = "Payment API endpoint",
        };

        IReadOnlyList<GraphEdge> edges = RequestAssumptionEdgeMaterializer.Materialize([assumption, requirement]);

        GraphEdge edge = edges.Should().ContainSingle().Subject;
        edge.FromNodeId.Should().Be("assumption-1");
        edge.ToNodeId.Should().Be("req-payment");
        edge.EdgeType.Should().Be(GraphEdgeTypes.RelatesTo);
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.StructuredBriefAssumptionLink);
    }

    [Fact]
    public void Materialize_links_assumption_to_actor_when_label_tokens_overlap()
    {
        GraphNode assumption = CreateAssumption("assumption-1", "Entra ID for staff operators");
        GraphNode actor = new()
        {
            NodeId = "actor-staff",
            NodeType = GraphNodeTypes.Actor,
            Label = "Staff operator",
        };

        IReadOnlyList<GraphEdge> edges = RequestAssumptionEdgeMaterializer.Materialize([assumption, actor]);

        edges.Should().ContainSingle();
        edges[0].ToNodeId.Should().Be("actor-staff");
    }

    [Fact]
    public void Materialize_returns_empty_when_no_structured_brief_assumptions()
    {
        GraphNode requirement = new()
        {
            NodeId = "req-1",
            NodeType = GraphNodeTypes.Requirement,
            Label = "Payment API endpoint",
        };

        RequestAssumptionEdgeMaterializer.Materialize([requirement]).Should().BeEmpty();
    }

    [Fact]
    public void MaterializeFromAssumptionsMetadata_and_edges_produce_connector_trace()
    {
        Guid snapshotId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        IReadOnlyList<GraphNode> assumptions =
            RequestAssumptionMaterializer.MaterializeFromAssumptionsMetadata(
                "Single-region MVP for payment API",
                snapshotId);

        GraphNode requirement = new()
        {
            NodeId = "req-payment",
            NodeType = GraphNodeTypes.Requirement,
            Label = "Payment API residency",
        };

        IReadOnlyList<GraphEdge> edges =
            RequestAssumptionEdgeMaterializer.Materialize([.. assumptions, requirement]);

        assumptions.Should().ContainSingle();
        edges.Should().ContainSingle();
        edges[0].FromNodeId.Should().Be(assumptions[0].NodeId);
    }

    private static GraphNode CreateAssumption(string nodeId, string assumptionText) =>
        new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.Assumption,
            Label = assumptionText,
            SourceType = "StructuredBriefAssumption",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["assumptionText"] = assumptionText,
                ["source"] = "structured-brief",
            },
        };
}
