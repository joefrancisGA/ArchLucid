using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramExecutiveVnetPeeringOverlayLabelApplierTests
{
    [Fact]
    public void Apply_does_not_stamp_peering_on_blank_virtual_network_pair()
    {
        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vnet-a",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                },
                new DiagramNode
                {
                    NodeId = "vnet-b",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vnet-a",
                    ToNodeId = "vnet-b",
                    Label = string.Empty,
                },
            ],
        };

        DiagramExecutiveVnetPeeringOverlayLabelApplier.Apply(ast);

        DiagramEdge edge = ast.Edges.Single();
        edge.Label.Should().BeEmpty();
        edge.InferenceSource.Should().BeNull();
        edge.ProvenanceKind.Should().BeNull();
    }

    [Fact]
    public void Apply_does_not_stamp_peering_on_relationship_not_stored_label()
    {
        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vnet-a",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                },
                new DiagramNode
                {
                    NodeId = "vnet-b",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vnet-a",
                    ToNodeId = "vnet-b",
                    Label = DiagramConnectionTypeAnnotator.RelationshipNotStoredLabel,
                },
            ],
        };

        DiagramExecutiveVnetPeeringOverlayLabelApplier.Apply(ast);

        DiagramEdge edge = ast.Edges.Single();
        edge.Label.Should().Be(DiagramConnectionTypeAnnotator.RelationshipNotStoredLabel);
        edge.ProvenanceKind.Should().BeNull();
    }
}
