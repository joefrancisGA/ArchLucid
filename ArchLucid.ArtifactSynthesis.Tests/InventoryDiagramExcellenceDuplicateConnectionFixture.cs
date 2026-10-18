using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Duplicate Logic App connections for IDX-09b excellence ratchet.</summary>
public static class InventoryDiagramExcellenceDuplicateConnectionFixture
{
    public static DiagramAst BuildDuplicateOffice365Connections()
    {
        return new DiagramAst
        {
            Title = "Azure inventory (FullSubscription)",
            Nodes =
            [
                WorkflowNode("workflow", "rg-app"),
                ConnectionNode("connection-a", "Office 365", "rg-app"),
                ConnectionNode("connection-b", "Office 365", "rg-app"),
            ],
            Edges =
            [
                CitedEdge("workflow", "connection-a"),
                CitedEdge("workflow", "connection-b"),
            ],
        };
    }

    public static DiagramAst BuildDistinctApiConnections()
    {
        return new DiagramAst
        {
            Title = "Azure inventory (FullSubscription)",
            Nodes =
            [
                WorkflowNode("workflow", "rg-app"),
                ConnectionNode("connection-office", "Office 365", "rg-app"),
                ConnectionNode("connection-teams", "Microsoft Teams", "rg-app"),
            ],
            Edges =
            [
                CitedEdge("workflow", "connection-office"),
                CitedEdge("workflow", "connection-teams"),
            ],
        };
    }

    private static DiagramNode WorkflowNode(string nodeId, string resourceGroup)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = nodeId,
            NodeType = "TopologyResource",
            ArmResourceType = "Microsoft.Web/sites",
            ArmResourceGroup = resourceGroup,
        };
    }

    private static DiagramNode ConnectionNode(string nodeId, string label, string resourceGroup)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            NodeType = "TopologyResource",
            ArmResourceType = "Microsoft.Web/connections",
            ArmResourceGroup = resourceGroup,
        };
    }

    private static DiagramEdge CitedEdge(string fromNodeId, string toNodeId)
    {
        return new DiagramEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Label = "uses",
        };
    }
}
