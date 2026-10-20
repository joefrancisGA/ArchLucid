using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Canonical two-stage Data Flow hub pipeline graph for IDX-07f ratchet (07b–07e).</summary>
public static class InventoryDiagramExcellenceDataFlowHubPipelineFixture
{
    public const string StageSourceId = "stage_source";
    public const string StageTransformId = "stage_transform";
    public const string LandingNodeId = "landing";
    public const string FactoryNodeId = "adf";

    public static DiagramAst Build()
    {
        List<DiagramNode> nodes =
        [
            Node(LandingNodeId, "landing", "Microsoft.Storage/storageAccounts", StageSourceId, orderKey: 0),
            Node(FactoryNodeId, "factory", "Microsoft.DataFactory/factories", StageTransformId, orderKey: 0),
            ..Enumerable.Range(0, 12).Select(index =>
                Node($"st{index}", $"lake_{index}", "Microsoft.Storage/storageAccounts", StageTransformId, orderKey: index + 1)),
        ];
        List<DiagramEdge> edges =
        [
            Edge(LandingNodeId, FactoryNodeId),
            ..Enumerable.Range(0, 12).Select(index => Edge(FactoryNodeId, $"st{index}")),
        ];

        return new DiagramAst
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = StageSourceId, Label = "Source", OrderKey = 0 },
                new DiagramSubgraph { SubgraphId = StageTransformId, Label = "Ingestion", OrderKey = 1 },
            ],
            Nodes = nodes,
            Edges = edges,
        };
    }

    public static IReadOnlyList<string> SpokeNodeIds()
    {
        return Enumerable.Range(0, 12).Select(index => $"st{index}").ToList();
    }

    public static IReadOnlyList<string> AllRenderableNodeIds()
    {
        return [LandingNodeId, FactoryNodeId, ..SpokeNodeIds()];
    }

    private static DiagramNode Node(string nodeId, string label, string armType, string subgraphId, int orderKey)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            NodeType = "TopologyResource",
            ArmResourceType = armType,
            ArmResourceGroup = "rg-data",
            SubgraphId = subgraphId,
            OrderKey = orderKey,
        };
    }

    private static DiagramEdge Edge(string fromNodeId, string toNodeId)
    {
        return new DiagramEdge { FromNodeId = fromNodeId, ToNodeId = toNodeId, Label = "writes" };
    }
}
