using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotGraphEdgeRoleDeduplicatorTests
{
    [Fact]
    public void Deduplicate_drops_connects_to_when_cited_placement_exists_for_same_endpoints()
    {
        List<GraphEdge> edges =
        [
            new GraphEdge
            {
                EdgeId = "edge-collocation",
                FromNodeId = "vm-1",
                ToNodeId = "vnet-1",
                EdgeType = GraphEdgeTypes.ConnectsTo,
                InferenceSource = GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred,
                ProvenanceKind = ProvenanceKind.DeterministicInference.ToString(),
            },
            new GraphEdge
            {
                EdgeId = "edge-cited",
                FromNodeId = "vm-1",
                ToNodeId = "vnet-1",
                EdgeType = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
                ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
            },
        ];
        HashSet<string> edgeKeys = new(StringComparer.Ordinal)
        {
            "vm-1|vnet-1|CONNECTS_TO",
            "vm-1|vnet-1|nicToSubnet",
        };

        AzureInventorySnapshotGraphEdgeRoleDeduplicator.Deduplicate(edges, edgeKeys);

        edges.Should().ContainSingle(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet);
        edges.Should().NotContain(edge => edge.EdgeType == GraphEdgeTypes.ConnectsTo);
        edgeKeys.Should().ContainSingle(key => key.Contains("nicToSubnet", StringComparison.Ordinal));
    }
}
