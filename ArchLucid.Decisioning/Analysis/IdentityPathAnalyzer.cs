using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Bounded graph walk from machine <see cref="GraphNodeTypes.Actor" /> nodes through role assignments to regulated
///     datastores (DX-06).
/// </summary>
public static class IdentityPathAnalyzer
{
    public const int MaxHopCount = 8;

    public const int MaxFindings = 20;

    public static IReadOnlyList<IdentityBlastRadiusPath> Analyze(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return [];
        }

        Dictionary<string, GraphNode> nodesById = graphSnapshot.Nodes
            .Where(static node => !string.IsNullOrWhiteSpace(node.NodeId))
            .GroupBy(static node => node.NodeId.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase);

        Dictionary<string, List<string>> adjacency = BuildAdjacency(graphSnapshot, nodesById);

        List<IdentityBlastRadiusPath> paths = [];

        foreach (GraphNode actor in graphSnapshot.GetNodesByType(GraphNodeTypes.Actor).Where(IsMachineActor))
        {
            CollectPathsFromActor(graphSnapshot, actor, nodesById, adjacency, paths);
        }

        return paths
            .GroupBy(
                static path => $"{path.ActorNodeId}|{path.DatastoreNodeId}|{path.RoleName}",
                StringComparer.OrdinalIgnoreCase)
            .Select(static group => group.OrderBy(static path => path.HopCount).First())
            .OrderByDescending(static path => path.HopCount)
            .ThenBy(static path => path.ActorLabel, StringComparer.OrdinalIgnoreCase)
            .Take(MaxFindings)
            .ToList();
    }

    private static void CollectPathsFromActor(
        GraphSnapshot graphSnapshot,
        GraphNode actor,
        IReadOnlyDictionary<string, GraphNode> nodesById,
        IReadOnlyDictionary<string, List<string>> adjacency,
        List<IdentityBlastRadiusPath> paths)
    {
        Queue<(string NodeId, int HopCount, List<string> PathNodeIds, string? ActiveRoleName)> queue = new();
        HashSet<string> visited = new(StringComparer.OrdinalIgnoreCase)
        {
            actor.NodeId,
        };

        queue.Enqueue((actor.NodeId, 0, [actor.NodeId], ActiveRoleName: null));

        while (queue.Count > 0)
        {
            (string nodeId, int hopCount, List<string> pathNodeIds, string? activeRoleName) = queue.Dequeue();

            if (hopCount >= MaxHopCount)
            {
                continue;
            }

            if (!nodesById.TryGetValue(nodeId, out GraphNode? currentNode))
            {
                continue;
            }

            string? roleOnPath = activeRoleName;

            if (TryResolveRoleAssignment(currentNode, out string? roleName))
            {
                if (IdentityBlastRadiusRoleNames.IsReadOnlyRole(roleName))
                {
                    roleOnPath = null;
                }
                else if (IdentityBlastRadiusRoleNames.IsWriteAdminRole(roleName))
                {
                    roleOnPath = roleName!.Trim();
                }
            }

            if (roleOnPath is not null
                && IdentityRegulatedDatastoreClassifier.IsRegulatedDatastore(graphSnapshot, currentNode))
            {
                paths.Add(new IdentityBlastRadiusPath(
                    actor.NodeId,
                    ResolveLabel(actor),
                    currentNode.NodeId,
                    ResolveLabel(currentNode),
                    roleOnPath,
                    hopCount,
                    pathNodeIds.ToList()));
            }

            if (!adjacency.TryGetValue(nodeId, out List<string>? neighbors))
            {
                continue;
            }

            foreach (string neighborId in neighbors)
            {
                if (visited.Contains(neighborId))
                {
                    continue;
                }

                visited.Add(neighborId);
                List<string> nextPath = [.. pathNodeIds, neighborId];
                queue.Enqueue((neighborId, hopCount + 1, nextPath, roleOnPath));
            }
        }
    }

    private static Dictionary<string, List<string>> BuildAdjacency(
        GraphSnapshot graphSnapshot,
        IReadOnlyDictionary<string, GraphNode> nodesById)
    {
        Dictionary<string, List<string>> adjacency = new(StringComparer.OrdinalIgnoreCase);

        if (graphSnapshot.Edges is null)
        {
            return adjacency;
        }

        foreach (GraphEdge edge in graphSnapshot.Edges)
        {
            if (string.IsNullOrWhiteSpace(edge.FromNodeId)
                || string.IsNullOrWhiteSpace(edge.ToNodeId))
            {
                continue;
            }

            if (!nodesById.ContainsKey(edge.FromNodeId) || !nodesById.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            AddNeighbor(adjacency, edge.FromNodeId, edge.ToNodeId);
            AddNeighbor(adjacency, edge.ToNodeId, edge.FromNodeId);
        }

        return adjacency;
    }

    private static void AddNeighbor(Dictionary<string, List<string>> adjacency, string fromNodeId, string toNodeId)
    {
        if (!adjacency.TryGetValue(fromNodeId, out List<string>? neighbors))
        {
            neighbors = [];
            adjacency[fromNodeId] = neighbors;
        }

        if (!neighbors.Contains(toNodeId, StringComparer.OrdinalIgnoreCase))
        {
            neighbors.Add(toNodeId);
        }
    }

    private static bool IsMachineActor(GraphNode actor)
    {
        if (!actor.Properties.TryGetValue("kind", out string? kind))
        {
            return false;
        }

        return string.Equals(kind, nameof(ActorKind.Machine), StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryResolveRoleAssignment(GraphNode node, out string? roleName)
    {
        if (string.Equals(node.NodeType, GraphNodeTypes.PolicyControl, StringComparison.OrdinalIgnoreCase))
        {
            return TryReadRoleName(node.Properties, out roleName);
        }

        if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
        {
            roleName = null;

            return false;
        }

        if (TryGetProperty(node.Properties, "terraformType", out string? terraformType)
            && IsRoleAssignmentTerraformType(terraformType))
        {
            return TryReadRoleName(node.Properties, out roleName);
        }

        if (TryGetProperty(node.Properties, "resourceType", out string? resourceType)
            && IsRoleAssignmentResourceType(resourceType))
        {
            return TryReadRoleName(node.Properties, out roleName);
        }

        roleName = null;

        return false;
    }

    private static bool IsRoleAssignmentTerraformType(string? terraformType)
    {
        if (string.IsNullOrWhiteSpace(terraformType))
        {
            return false;
        }

        return terraformType.Contains("role_assignment", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("iam_role_policy", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("iam_policy", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("project_iam", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsRoleAssignmentResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Contains("roleAssignments", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("iam", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryReadRoleName(IReadOnlyDictionary<string, string> properties, out string? roleName)
    {
        string[] candidateKeys =
        [
            "roleName",
            "roleDefinitionName",
            "role_name",
            "tf.role_definition_name",
            "tf.role_name",
            "tf.role_definition_id",
            "roleDefinitionId",
        ];

        foreach (string key in candidateKeys)
        {
            if (TryGetProperty(properties, key, out string? value)
                && !string.IsNullOrWhiteSpace(value))
            {
                roleName = value.Trim();

                return true;
            }
        }

        roleName = null;

        return false;
    }

    private static string ResolveLabel(GraphNode node) =>
        string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label.Trim();

    private static bool TryGetProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(entry.Value))
            {
                value = entry.Value.Trim();

                return true;
            }
        }

        value = null;

        return false;
    }
}
