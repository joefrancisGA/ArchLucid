using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramIndirectRelationshipResolverTests
{
    [Fact]
    public void IsCitedEdge_returns_false_for_resource_group_collocation()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-collocation",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.ResourceGroupCollocation,
        };

        InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge).Should().BeFalse();
    }

    [Fact]
    public void IsCitedEdge_returns_true_for_known_association_type()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-nic-subnet",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
            InferenceSource = "inventory-nic-subnet",
        };

        InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge).Should().BeTrue();
    }

    [Fact]
    public void IsCitedEdge_returns_true_for_catalog_mapped_inference_source()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-app-authorized-access",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "MAY_ACCESS",
            InferenceSource = "inventory-app-authorized-access",
        };

        InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge).Should().BeTrue();
    }

    [Fact]
    public void IsCitedEdge_returns_true_for_property_arm_id_inference_source()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-property-arm-id",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.PropertyArmId,
        };

        InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge).Should().BeTrue();
    }

    [Fact]
    public void IsCitedEdge_returns_true_for_indirect_derived_relationship_inference_source()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-indirect-derived",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.IndirectDerivedRelationship,
        };

        InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge).Should().BeTrue();
    }

    [Fact]
    public void IsCitedEdge_returns_true_when_evidence_currency_property_is_set()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-currency",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = "topology-connects-to",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency] =
                    InventoryDiagramEvidenceCurrency.Current.ToString(),
            },
        };

        InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge).Should().BeTrue();
    }

    [Fact]
    public void IsCitedEdge_returns_true_when_evidence_source_property_is_set()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-evidence-source",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = "topology-connects-to",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceSource] = "cited",
            },
        };

        InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge).Should().BeTrue();
    }

    [Fact]
    public void IsCitedEdge_returns_false_for_uncited_topology_edge()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-uncited",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = "topology-connects-to",
        };

        InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge).Should().BeFalse();
    }

    [Fact]
    public void ResolveEvidenceCurrency_returns_observed_for_observed_dependency_edge()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-observed",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.ObservedDependency,
        };

        InventoryDiagramIndirectRelationshipResolver
            .ResolveEvidenceCurrency(edge, fromNode: null)
            .Should()
            .Be(InventoryDiagramEvidenceCurrency.Observed);
    }

    [Fact]
    public void ResolveEvidenceCurrency_returns_configured_from_source_node_property()
    {
        GraphNode fromNode = new()
        {
            NodeId = "from",
            NodeType = "TopologyResource",
            Label = "from",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency] =
                    InventoryDiagramEvidenceCurrency.Configured.ToString(),
            },
        };
        GraphEdge edge = new()
        {
            EdgeId = "edge-configured",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.PropertyArmId,
        };

        InventoryDiagramIndirectRelationshipResolver
            .ResolveEvidenceCurrency(edge, fromNode)
            .Should()
            .Be(InventoryDiagramEvidenceCurrency.Configured);
    }
}
