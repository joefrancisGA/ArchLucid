using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramEdgeLabelHumanizerTests
{
    [Theory]
    [InlineData(GraphEdgeTypes.PeersWith, "peering")]
    [InlineData(GraphEdgeTypes.ConnectsTo, "connects")]
    [InlineData(GraphEdgeTypes.Contains, "contains")]
    [InlineData(GraphEdgeTypes.ContainsResource, "contains")]
    [InlineData(GraphEdgeTypes.Protects, "protects")]
    [InlineData(GraphEdgeTypes.AppliesTo, "applies to")]
    [InlineData(GraphEdgeTypes.RelatesTo, "relates to")]
    [InlineData(GraphEdgeTypes.DependsOn, "depends on")]
    [InlineData(GraphEdgeTypes.Exposes, "exposes")]
    [InlineData(GraphEdgeTypes.HasRole, "has role")]
    [InlineData(GraphEdgeTypes.UsesIdentity, "uses identity")]
    [InlineData(GraphEdgeTypes.CanRead, "can read")]
    [InlineData(GraphEdgeTypes.CanWrite, "can write")]
    [InlineData(GraphEdgeTypes.CanAssume, "can assume")]
    [InlineData(GraphEdgeTypes.RoutesTo, "routes to")]
    [InlineData(GraphEdgeTypes.FederatesAs, "federates as")]
    [InlineData(GraphEdgeTypes.MemberOf, "member of")]
    public void ResolveDisplayLabel_humanizes_known_graph_edge_types(string edgeType, string expected)
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(null, edgeType).Should().Be(expected);
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(edgeType, edgeType).Should().Be(expected);
    }

    [Theory]
    [InlineData(AzureInventoryRelationshipAssociationTypes.VnetPeering, "peering")]
    [InlineData(GraphEdgeInferenceSources.InventoryVnetPeering, "peering")]
    [InlineData(GraphEdgeInferenceSources.InventoryNicSubnet, "connects")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.NicToSubnet, "connects")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfLinkedService, "Connected to")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred, "Likely connected to")]
    public void HumanizeLabel_maps_inventory_association_and_inference_aliases(string alias, string expected)
    {
        DiagramEdgeLabelHumanizer.HumanizeLabel(alias).Should().Be(expected);
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(null, null, alias).Should().Be(expected);
    }

    [Fact]
    public void ResolveDisplayLabel_uses_inference_source_when_label_and_type_are_blank()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                string.Empty,
                GraphEdgeInferenceSources.InventoryVnetPeering)
            .Should()
            .Be("peering");
    }

    [Fact]
    public void HumanizeLabel_preserves_custom_non_canonical_labels()
    {
        DiagramEdgeLabelHumanizer.HumanizeLabel("reads").Should().Be("reads");
    }
}
