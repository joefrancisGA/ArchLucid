using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Testing;

/// <summary>GraphSnapshot for IDX-13e / IDX-13f — compiles to the same hub pipeline shape as the hand AST fixture.</summary>
internal static class InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture
{
    public const string LandingGraphNodeId = "landing";
    public const string FactoryGraphNodeId = "adf";
    public const string SubscriptionId = "11111111-1111-1111-1111-111111111111";
    public const string ResourceGroup = "rg-data";

    public static GraphSnapshot Build()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = new DateTime(2026, 10, 18, 0, 0, 0, DateTimeKind.Utc),
        };

        graph.Nodes.Add(CreateTopologyNode(
            LandingGraphNodeId,
            "landing",
            "Microsoft.Storage/storageAccounts",
            GraphTopologyCategories.Storage));
        graph.Nodes.Add(CreateTopologyNode(
            FactoryGraphNodeId,
            "factory",
            "Microsoft.DataFactory/factories",
            GraphTopologyCategories.Data));

        foreach (int index in Enumerable.Range(0, 12))
        {
            graph.Nodes.Add(CreateTopologyNode(
                $"st{index}",
                $"lake_{index}",
                "Microsoft.Storage/storageAccounts",
                GraphTopologyCategories.Storage));
        }

        graph.Edges.Add(CreateAdfReadsFromEdge("edge_landing_read", FactoryGraphNodeId, LandingGraphNodeId));
        graph.Edges.Add(CreateAdfWritesToEdge("edge_landing_to_factory", LandingGraphNodeId, FactoryGraphNodeId));

        foreach (int index in Enumerable.Range(0, 12))
        {
            graph.Edges.Add(CreateAdfWritesToEdge($"edge_sink_{index}", FactoryGraphNodeId, $"st{index}"));
        }

        return graph;
    }

    public static IReadOnlyList<string> SpokeGraphNodeIds()
    {
        return Enumerable.Range(0, 12).Select(index => $"st{index}").ToList();
    }

    public static IReadOnlyList<string> AllGraphNodeIds()
    {
        return [LandingGraphNodeId, FactoryGraphNodeId, ..SpokeGraphNodeIds()];
    }

    private static GraphNode CreateTopologyNode(
        string nodeId,
        string label,
        string armType,
        string category)
    {
        string armId =
            $"/subscriptions/{SubscriptionId}/resourceGroups/{ResourceGroup}/providers/{armType}/{label}";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
            ["arm.resourceGroup"] = ResourceGroup,
            ["arm.subscriptionId"] = SubscriptionId,
            ["arm.region"] = "eastus",
        };

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = category,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = properties,
        };
    }

    private static GraphEdge CreateAdfReadsFromEdge(string edgeId, string fromNodeId, string toNodeId)
    {
        return new GraphEdge
        {
            EdgeId = edgeId,
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = AzureInventoryRelationshipAssociationTypes.AdfReadsFrom,
            Label = AzureInventoryRelationshipAssociationTypes.AdfReadsFrom,
            Weight = 1,
            InferenceSource = GraphEdgeInferenceSources.InventoryAdfReadsFrom,
        };
    }

    private static GraphEdge CreateAdfWritesToEdge(string edgeId, string fromNodeId, string toNodeId)
    {
        return new GraphEdge
        {
            EdgeId = edgeId,
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = AzureInventoryRelationshipAssociationTypes.AdfWritesTo,
            Label = AzureInventoryRelationshipAssociationTypes.AdfWritesTo,
            Weight = 1,
            InferenceSource = GraphEdgeInferenceSources.InventoryAdfWritesTo,
        };
    }
}
