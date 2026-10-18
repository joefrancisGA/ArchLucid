using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Isolated singleton RG tail for IDX-08b excellence ratchet.</summary>
public static class InventoryDiagramExcellenceSingletonTailFixture
{
    public const string LargeGroupNodeId = "rg-large-member";

    public static DiagramAst BuildSubscriptionScoped(DiagramMode mode)
    {
        List<DiagramNode> nodes =
        [
            new DiagramNode
            {
                NodeId = LargeGroupNodeId,
                Label = "large-vm",
                ArmResourceGroup = "rg-large",
                OrderKey = 0,
            },
            new DiagramNode
            {
                NodeId = "rg-large-member-2",
                Label = "large-nic",
                ArmResourceGroup = "rg-large",
                OrderKey = 1,
            },
        ];

        for (int index = 0; index < DiagramForestSingletonTailPlanner.SingletonThreshold + 1; index++)
        {
            nodes.Add(new DiagramNode
            {
                NodeId = $"singleton-{index}",
                Label = $"singleton-{index}",
                ArmResourceGroup = $"rg-singleton-{index}",
                OrderKey = index + 2,
            });
        }

        return new DiagramAst
        {
            Title = $"Azure inventory ({mode})",
            Nodes = nodes,
            Edges = [],
        };
    }

    public static DiagramAst BuildWithCitedCrossGroupSingleton(DiagramMode mode)
    {
        DiagramNode singleton = new()
        {
            NodeId = "singleton-cited",
            Label = "singleton-cited",
            ArmResourceGroup = "rg-cited",
            OrderKey = 0,
        };
        DiagramNode hub = new()
        {
            NodeId = "hub-member",
            Label = "hub-vm",
            ArmResourceGroup = "rg-hub",
            OrderKey = 1,
        };
        List<DiagramNode> nodes = [singleton, hub];

        for (int index = 0; index < DiagramForestSingletonTailPlanner.SingletonThreshold; index++)
        {
            nodes.Add(new DiagramNode
            {
                NodeId = $"tail-{index}",
                Label = $"tail-{index}",
                ArmResourceGroup = $"rg-tail-{index}",
                OrderKey = index + 2,
            });
        }

        DiagramEdge peering = new()
        {
            FromNodeId = singleton.NodeId,
            ToNodeId = hub.NodeId,
            Label = GraphEdgeTypes.PeersWith,
            InferenceSource = GraphEdgeInferenceSources.InventoryVnetPeering,
        };

        return new DiagramAst
        {
            Title = $"Azure inventory ({mode})",
            Nodes = nodes,
            Edges = [peering],
        };
    }
}
