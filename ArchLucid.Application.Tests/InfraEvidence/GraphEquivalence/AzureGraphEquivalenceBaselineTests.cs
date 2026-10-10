using System.Text.Json;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence.GraphEquivalence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureGraphEquivalenceBaselineTests
{
    public static IEnumerable<object[]> Cases => AzureGraphEquivalenceFixtures.All().Select(fixture => new object[] { fixture.Name });

    [Theory]
    [MemberData(nameof(Cases))]
    public async Task Graph_and_diagram_semantics_match_pinned_master(string name)
    {
        AzureGraphEquivalenceCase fixture = AzureGraphEquivalenceFixtures.All().Single(candidate => candidate.Name == name);
        GraphSnapshot graph = await ResolveAsync(fixture);
        string baselineName = name == "private-link-property" ? "private-link-4396.json" : "master-3c0c4fd9.json";
        using Stream stream = typeof(AzureGraphEquivalenceBaselineTests).Assembly.GetManifestResourceStream(
            "ArchLucid.Application.Tests.InfraEvidence.GraphEquivalence." + baselineName)!;
        using JsonDocument baseline = await JsonDocument.ParseAsync(stream);
        JsonElement expected = baseline.RootElement.GetProperty("cases").GetProperty(name);
        JsonSerializer.Serialize(AzureGraphSemanticCapture.Capture(graph)).Should().Be(JsonSerializer.Serialize(expected),
            "a refactor must explain any change to the pinned semantic baseline for {0}", name);

        // Independently authored expectations are separate from the recorded baseline.
        bool edgeExists = graph.Edges.Any(edge => edge.EdgeType == fixture.EdgeType
            && graph.Nodes.Any(node => node.NodeId == edge.FromNodeId && SameArmId(node.SourceId, fixture.FromArmId))
            && graph.Nodes.Any(node => node.NodeId == edge.ToNodeId && SameArmId(node.SourceId, fixture.ToArmId)));
        edgeExists.Should().Be(fixture.ExpectEdge);
        if (name == "private-link-property")
        {
            GraphEdge target = graph.Edges.Should().ContainSingle().Subject;
            target.EdgeType.Should().Be(AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget);
            target.ProvenanceKind.Should().Be(nameof(ProvenanceKind.DeterministicInference));
            target.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryPrivateEndpoint);
            target.Properties["evidence.propertyKey"].Should().Be("privateLinkServiceId");
            target.Properties["evidence.resourceRowId"].Should().Be("00000000-0000-0000-0000-000000000004");
            target.Properties["evidence.targetArmId"].Should().Be(ArmResourceIdNormalizer.Normalize(fixture.ToArmId));
        }
        if (fixture.PlaceholderArmId is not null)
        {
            graph.Nodes.Single(node => SameArmId(node.SourceId, fixture.PlaceholderArmId))
                .Properties["inventory.collectionStatus"].Should().Be("referenced-not-collected");
        }
        if (name == "hidden-default")
        {
            graph.Nodes.Should().NotContain(node => SameArmId(node.SourceId, fixture.ToArmId));
        }
    }

    [Fact]
    public async Task Comparison_ignores_node_identifiers_and_enumeration_order()
    {
        GraphSnapshot graph = await ResolveAsync(AzureGraphEquivalenceFixtures.All().Single(fixture => fixture.Name == "explicit"));
        JsonElement before = AzureGraphSemanticCapture.Capture(graph);
        Dictionary<string, string> remap = graph.Nodes.ToDictionary(node => node.NodeId, node => "renamed-" + node.NodeId);
        foreach (GraphNode node in graph.Nodes)
            node.NodeId = remap[node.NodeId];
        foreach (GraphEdge edge in graph.Edges)
        {
            edge.EdgeId = "different-edge-id";
            edge.FromNodeId = remap[edge.FromNodeId];
            edge.ToNodeId = remap[edge.ToNodeId];
        }
        graph.Nodes.Reverse();
        graph.Edges.Reverse();
        JsonSerializer.Serialize(AzureGraphSemanticCapture.Capture(graph)).Should().Be(JsonSerializer.Serialize(before));
    }

    [Theory]
    [InlineData("direction")]
    [InlineData("type")]
    [InlineData("provenance")]
    public async Task Comparison_detects_meaningful_edge_changes(string mutation)
    {
        GraphSnapshot graph = await ResolveAsync(AzureGraphEquivalenceFixtures.All().Single(fixture => fixture.Name == "explicit"));
        JsonElement before = AzureGraphSemanticCapture.Capture(graph);
        GraphEdge edge = graph.Edges.Single();
        switch (mutation)
        {
            case "direction": (edge.FromNodeId, edge.ToNodeId) = (edge.ToNodeId, edge.FromNodeId); break;
            case "type": edge.EdgeType = "DIFFERENT_TYPE"; break;
            case "provenance": edge.ProvenanceKind = nameof(ProvenanceKind.DeterministicInference); break;
        }
        JsonSerializer.Serialize(AzureGraphSemanticCapture.Capture(graph)).Should().NotBe(JsonSerializer.Serialize(before));
    }

    private static bool SameArmId(string? left, string right) => ArmResourceIdNormalizer.Normalize(left) == ArmResourceIdNormalizer.Normalize(right);

    private static async Task<GraphSnapshot> ResolveAsync(AzureGraphEquivalenceCase fixture)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(candidate => candidate.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(),
            fixture.Snapshot.Header.SnapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(fixture.Snapshot);
        AzureInventorySnapshotGraphResolveResult result = await new AzureInventorySnapshotGraphResolver(repository.Object)
            .TryResolveGraphAsync(new ScopeContext
            {
                TenantId = fixture.Snapshot.Header.TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
            }, fixture.Snapshot.Header.SnapshotId, includeNeverShowArmTypes: fixture.IncludeHidden);
        result.Succeeded.Should().BeTrue();
        return result.Graph!;
    }
}
