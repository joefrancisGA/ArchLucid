using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramConnectionTypeAnnotatorTests
{
    [Fact]
    public void Annotate_labels_blank_virtual_network_edge_without_inventing_peering()
    {
        DiagramAst ast = CreateVirtualNetworkPairAst();

        DiagramConnectionTypeAnnotator.Annotate(ast);

        ast.Edges.Single().Label.Should().Be(DiagramConnectionTypeAnnotator.RelationshipNotStoredLabel);
    }

    [Fact]
    public void Annotate_labels_blank_non_virtual_network_connector()
    {
        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "storage",
                    Label = "storage",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                },
                new DiagramNode
                {
                    NodeId = "app",
                    Label = "app",
                    ArmResourceType = "Microsoft.Web/sites",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "app",
                    ToNodeId = "storage",
                    Label = string.Empty,
                },
            ],
        };

        DiagramConnectionTypeAnnotator.Annotate(ast);

        ast.Edges.Single().Label.Should().Be(DiagramConnectionTypeAnnotator.RelationshipNotStoredLabel);
    }

    [Fact]
    public void Annotate_labels_blank_private_endpoint_edge_with_stored_access_copy_P04()
    {
        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "pe",
                    Label = "pe",
                    ArmResourceType = "Microsoft.Network/privateEndpoints",
                },
                new DiagramNode
                {
                    NodeId = "storage",
                    Label = "storage",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "pe",
                    ToNodeId = "storage",
                    Label = string.Empty,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                },
            ],
        };

        DiagramConnectionTypeAnnotator.Annotate(ast);

        ast.Edges.Single().Label.Should().Be(
            "Private endpoint was inferred. Observed access was not stored.");
    }

    [Fact]
    public void Annotate_leaves_stored_connects_and_peering_verbs_unchanged()
    {
        DiagramAst connectsAst = CreateVirtualNetworkPairAst(label: "connects");
        DiagramAst peeringAst = CreateVirtualNetworkPairAst(label: "peering");

        DiagramConnectionTypeAnnotator.Annotate(connectsAst);
        DiagramConnectionTypeAnnotator.Annotate(peeringAst);

        connectsAst.Edges.Single().Label.Should().Be("connects");
        peeringAst.Edges.Single().Label.Should().Be("peering");
    }

    private static DiagramAst CreateVirtualNetworkPairAst(string label = "")
    {
        return new DiagramAst
        {
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vnet-a",
                    Label = "vnet-a",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                },
                new DiagramNode
                {
                    NodeId = "vnet-b",
                    Label = "vnet-b",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vnet-a",
                    ToNodeId = "vnet-b",
                    Label = label,
                },
            ],
        };
    }
}
