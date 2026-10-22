using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Orients peering connectors from client (spoke) toward server (hub/proxy).</summary>
public static class DiagramForestPeeringEdgeDirector
{
    private static readonly string[] ServerRoleTokens =
    [
        "proxy",
        "hub",
        "shared",
        "core",
        "gateway",
    ];

    private static readonly string[] ClientRoleTokens =
    [
        "spoke",
        "client",
        "-cs-",
        "-cs",
    ];

    public static (string ClientNodeId, string ServerNodeId) ResolveClientToServerEndpoints(
        DiagramEdge edge,
        IReadOnlyList<DiagramNode> component,
        IReadOnlyDictionary<string, DiagramNode> nodesById,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(edge);
        ArgumentNullException.ThrowIfNull(component);
        ArgumentNullException.ThrowIfNull(nodesById);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        if (!nodesById.TryGetValue(edge.FromNodeId, out DiagramNode? fromNode)
            || !nodesById.TryGetValue(edge.ToNodeId, out DiagramNode? toNode))
        {
            return (edge.FromNodeId, edge.ToNodeId);
        }

        if (TryResolveByLabelRole(fromNode, toNode, out string clientNodeId, out string serverNodeId))
        {
            return (clientNodeId, serverNodeId);
        }

        DiagramNode? hub = DiagramHubSpokeLayerPlanner.ResolveHub(component, visibleEdges);

        if (hub is not null)
        {
            if (string.Equals(edge.FromNodeId, hub.NodeId, StringComparison.Ordinal))
            {
                return (edge.ToNodeId, edge.FromNodeId);
            }

            if (string.Equals(edge.ToNodeId, hub.NodeId, StringComparison.Ordinal))
            {
                return (edge.FromNodeId, edge.ToNodeId);
            }
        }

        int fromDegree = DiagramHubSpokeLayerPlanner.ResolveDegree(edge.FromNodeId, component, visibleEdges);
        int toDegree = DiagramHubSpokeLayerPlanner.ResolveDegree(edge.ToNodeId, component, visibleEdges);

        if (toDegree > fromDegree)
        {
            return (edge.FromNodeId, edge.ToNodeId);
        }

        if (fromDegree > toDegree)
        {
            return (edge.ToNodeId, edge.FromNodeId);
        }

        return (edge.FromNodeId, edge.ToNodeId);
    }

    private static bool TryResolveByLabelRole(
        DiagramNode fromNode,
        DiagramNode toNode,
        out string clientNodeId,
        out string serverNodeId)
    {
        bool fromServer = HasServerRoleLabel(fromNode.Label);
        bool toServer = HasServerRoleLabel(toNode.Label);
        bool fromClient = HasClientRoleLabel(fromNode.Label);
        bool toClient = HasClientRoleLabel(toNode.Label);

        if (fromServer && !toServer)
        {
            clientNodeId = toNode.NodeId;
            serverNodeId = fromNode.NodeId;

            return true;
        }

        if (toServer && !fromServer)
        {
            clientNodeId = fromNode.NodeId;
            serverNodeId = toNode.NodeId;

            return true;
        }

        if (fromClient && !toClient)
        {
            clientNodeId = fromNode.NodeId;
            serverNodeId = toNode.NodeId;

            return true;
        }

        if (toClient && !fromClient)
        {
            clientNodeId = toNode.NodeId;
            serverNodeId = fromNode.NodeId;

            return true;
        }

        clientNodeId = fromNode.NodeId;
        serverNodeId = toNode.NodeId;

        return false;
    }

    private static bool HasServerRoleLabel(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return false;
        }

        string normalized = label.Trim().ToLowerInvariant();

        return ServerRoleTokens.Any(token => normalized.Contains(token, StringComparison.Ordinal));
    }

    private static bool HasClientRoleLabel(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return false;
        }

        string normalized = label.Trim().ToLowerInvariant();

        return ClientRoleTokens.Any(token => normalized.Contains(token, StringComparison.Ordinal));
    }
}
