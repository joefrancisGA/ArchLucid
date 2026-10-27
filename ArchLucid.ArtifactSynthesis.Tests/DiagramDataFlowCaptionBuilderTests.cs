using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramDataFlowCaptionBuilderTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void BuildCaptions_omits_pipeline_direction_missing_when_reads_from_is_present()
    {
        GraphNode factory = CreateFactoryNode();
        GraphNode storage = CreateStorageNode();
        List<GraphEdge> edges =
        [
            CreateLinkedServiceEdge(factory.NodeId, storage.NodeId),
            CreateDirectionalEdge(
                factory.NodeId,
                storage.NodeId,
                AzureInventoryRelationshipAssociationTypes.AdfReadsFrom,
                GraphEdgeInferenceSources.InventoryAdfReadsFrom),
        ];

        IReadOnlyList<string> captions = DiagramDataFlowCaptionBuilder.BuildCaptions([factory, storage], edges);

        captions.Should().NotContain(DiagramDataFlowHonestyLegend.PipelineDirectionMissingSentence);
    }

    [Fact]
    public void BuildCaptions_includes_pipeline_direction_missing_when_only_linked_service_edges_exist()
    {
        GraphNode factory = CreateFactoryNode();
        GraphNode storage = CreateStorageNode();
        List<GraphEdge> edges = [CreateLinkedServiceEdge(factory.NodeId, storage.NodeId)];

        IReadOnlyList<string> captions = DiagramDataFlowCaptionBuilder.BuildCaptions([factory, storage], edges);

        captions.Should().Contain(DiagramDataFlowHonestyLegend.PipelineDirectionMissingSentence);
    }

    [Fact]
    public void Compile_data_flow_paints_reads_from_and_writes_to_and_omits_pipeline_direction_missing()
    {
        GraphSnapshot graph = BuildFactoryDirectionGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        ast.Edges.Should().Contain(edge => edge.Label == "Reads from");
        ast.Edges.Should().Contain(edge => edge.Label == "Writes to");
        ast.CaptionLines.Should().NotContain(DiagramDataFlowHonestyLegend.PipelineDirectionMissingSentence);
    }

    [Fact]
    public void BuildCaptions_omits_private_dns_sentence_when_private_dns_vnet_link_is_stored()
    {
        GraphNode storage = CreateStorageNode();
        List<GraphEdge> edges =
        [
            new GraphEdge
            {
                EdgeId = "pe-1",
                FromNodeId = "pe",
                ToNodeId = storage.NodeId,
                EdgeType = AzureInventoryRelationshipAssociationTypes.PeReachableTarget,
                InferenceSource = GraphEdgeInferenceSources.InventoryPeReachableTarget,
                Weight = 1,
            },
            new GraphEdge
            {
                EdgeId = "dns-1",
                FromNodeId = "zone",
                ToNodeId = "vnet",
                EdgeType = AzureInventoryRelationshipAssociationTypes.PrivateDnsVnetLink,
                InferenceSource = GraphEdgeInferenceSources.InventoryPrivateDnsVnet,
                Weight = 1,
            },
        ];

        IReadOnlyList<string> captions = DiagramDataFlowCaptionBuilder.BuildCaptions([storage], edges);

        captions.Should().NotContain(DiagramDataFlowHonestyLegend.PrivateNetworkPathDnsSentence);
    }

    [Fact]
    public void BuildCaptions_includes_private_dns_sentence_when_pe_reachable_without_dns_link()
    {
        GraphNode storage = CreateStorageNode();
        List<GraphEdge> edges =
        [
            new GraphEdge
            {
                EdgeId = "pe-1",
                FromNodeId = "pe",
                ToNodeId = storage.NodeId,
                EdgeType = AzureInventoryRelationshipAssociationTypes.PeReachableTarget,
                InferenceSource = GraphEdgeInferenceSources.InventoryPeReachableTarget,
                Weight = 1,
            },
        ];

        IReadOnlyList<string> captions = DiagramDataFlowCaptionBuilder.BuildCaptions([storage], edges);

        captions.Should().Contain(DiagramDataFlowHonestyLegend.PrivateNetworkPathDnsSentence);
    }

    [Fact]
    public void Compile_full_subscription_does_not_include_pipeline_direction_missing_caption()
    {
        GraphSnapshot graph = BuildFactoryDirectionGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.CaptionLines.Should().NotContain(DiagramDataFlowHonestyLegend.PipelineDirectionMissingSentence);
    }

    private static GraphSnapshot BuildFactoryDirectionGraph()
    {
        const string factoryArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        GraphNode externalSource = AzureInventoryAdfExternalSourceNodeFactory.CreateGraphNode(
            new AzureInventoryAdfLinkedServiceRow
            {
                FactoryResourceId = factoryArmId,
                LinkedServiceName = "SrcLS",
                LinkedServiceType = "AzureBlobStorage",
                TargetHost = "storage.example.com",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved,
            });

        graph.Nodes.Add(externalSource);
        graph.Nodes.Add(CreateFactoryNode());
        graph.Nodes.Add(CreateStorageNode());

        graph.Edges.Add(
            CreateDirectionalEdge(
                "adf-1",
                externalSource.NodeId,
                AzureInventoryRelationshipAssociationTypes.AdfReadsFrom,
                GraphEdgeInferenceSources.InventoryAdfReadsFrom));
        graph.Edges.Add(
            CreateDirectionalEdge(
                "adf-1",
                "st-1",
                AzureInventoryRelationshipAssociationTypes.AdfWritesTo,
                GraphEdgeInferenceSources.InventoryAdfWritesTo));
        graph.Edges.Add(CreateLinkedServiceEdge("adf-1", externalSource.NodeId));

        return graph;
    }

    private static GraphNode CreateFactoryNode()
    {
        return new GraphNode
        {
            NodeId = "adf-1",
            NodeType = "TopologyResource",
            Label = "adf1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["arm.type"] = "Microsoft.DataFactory/factories",
            },
        };
    }

    private static GraphNode CreateStorageNode()
    {
        return new GraphNode
        {
            NodeId = "st-1",
            NodeType = "TopologyResource",
            Label = "st1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["arm.type"] = "Microsoft.Storage/storageAccounts",
            },
        };
    }

    private static GraphEdge CreateLinkedServiceEdge(string fromNodeId, string toNodeId)
    {
        return new GraphEdge
        {
            EdgeId = $"ls-{fromNodeId}-{toNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = AzureInventoryRelationshipAssociationTypes.AdfLinkedService,
            Weight = 1,
        };
    }

    private static GraphEdge CreateDirectionalEdge(
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string inferenceSource)
    {
        return new GraphEdge
        {
            EdgeId = $"dir-{fromNodeId}-{toNodeId}-{edgeType}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            Weight = 1,
            InferenceSource = inferenceSource,
        };
    }
}
