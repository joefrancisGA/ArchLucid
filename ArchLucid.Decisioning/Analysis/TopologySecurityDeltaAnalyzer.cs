using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Detects closed security-semantic deltas between current and prior graph snapshots (DX-64).
/// </summary>
public static class TopologySecurityDeltaAnalyzer
{
    public static IReadOnlyList<TopologySecurityDelta> Analyze(GraphSnapshot currentGraph, GraphSnapshot priorGraph)
    {
        ArgumentNullException.ThrowIfNull(currentGraph);
        ArgumentNullException.ThrowIfNull(priorGraph);

        Dictionary<string, GraphNode> priorNodesById = IndexNodes(priorGraph);
        List<TopologySecurityDelta> deltas = [];

        foreach (GraphNode currentNode in currentGraph.Nodes ?? [])
        {
            if (string.IsNullOrWhiteSpace(currentNode.NodeId))
            {
                continue;
            }

            string nodeId = currentNode.NodeId.Trim();
            priorNodesById.TryGetValue(nodeId, out GraphNode? priorNode);
            IReadOnlyDictionary<string, string> priorProperties = priorNode?.Properties ?? EmptyProperties;

            if (TopologySecurityPublicNetworkHeuristic.HasUnsafePublicNetworkAccess(currentNode.Properties)
                && !TopologySecurityPublicNetworkHeuristic.HasUnsafePublicNetworkAccess(priorProperties))
            {
                deltas.Add(new TopologySecurityDelta(
                    TopologySecurityDeltaKind.PublicInboundAdded,
                    nodeId,
                    ResolveLabel(currentNode),
                    "Public network access appeared on a node that was not public on the prior graph."));
            }

            if (DrReplicaPropertyHeuristic.HasReplicaEvidence(priorProperties)
                && !DrReplicaPropertyHeuristic.HasReplicaEvidence(currentNode.Properties))
            {
                deltas.Add(new TopologySecurityDelta(
                    TopologySecurityDeltaKind.ReplicaOrFailoverRemoved,
                    nodeId,
                    ResolveLabel(currentNode),
                    "Replica or failover evidence present on the prior graph is absent on the current graph."));
            }

            if (SegmentationSemanticsPathAnalyzer.IsSegmentationControlNode(currentNode))
            {
                HashSet<int> currentPorts = SegmentationRuleParser.ParseRiskyRules(currentNode.Properties)
                    .Select(static rule => rule.DestinationPort)
                    .ToHashSet();
                HashSet<int> priorPorts = SegmentationRuleParser.ParseRiskyRules(priorProperties)
                    .Select(static rule => rule.DestinationPort)
                    .ToHashSet();

                foreach (int port in currentPorts)
                {
                    if (priorPorts.Contains(port))
                    {
                        continue;
                    }

                    deltas.Add(new TopologySecurityDelta(
                        TopologySecurityDeltaKind.AdminInboundWidened,
                        nodeId,
                        ResolveLabel(currentNode),
                        $"Admin inbound port {port} from Internet is newly permitted relative to the prior graph."));
                }
            }
        }

        deltas.AddRange(AnalyzeWriteAdminRoleAdditions(currentGraph, priorGraph));

        return deltas;
    }

    private static IReadOnlyList<TopologySecurityDelta> AnalyzeWriteAdminRoleAdditions(
        GraphSnapshot currentGraph,
        GraphSnapshot priorGraph)
    {
        HashSet<string> priorPathKeys = IdentityPathAnalyzer.Analyze(priorGraph)
            .Where(static path => IdentityBlastRadiusRoleNames.IsWriteAdminRole(path.RoleName))
            .Select(static path => BuildPathKey(path.ActorNodeId, path.DatastoreNodeId, path.RoleName))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<TopologySecurityDelta> deltas = [];

        foreach (IdentityBlastRadiusPath path in IdentityPathAnalyzer.Analyze(currentGraph)
                     .Where(static candidate => IdentityBlastRadiusRoleNames.IsWriteAdminRole(candidate.RoleName)))
        {
            string pathKey = BuildPathKey(path.ActorNodeId, path.DatastoreNodeId, path.RoleName);

            if (priorPathKeys.Contains(pathKey))
            {
                continue;
            }

            deltas.Add(new TopologySecurityDelta(
                TopologySecurityDeltaKind.WriteAdminRoleAdded,
                path.DatastoreNodeId,
                path.DatastoreLabel,
                $"Write/admin role '{path.RoleName}' from actor '{path.ActorLabel}' was absent on the prior graph."));
        }

        return deltas;
    }

    private static string BuildPathKey(string actorNodeId, string targetNodeId, string roleName) =>
        $"{actorNodeId}|{targetNodeId}|{roleName}";

    private static Dictionary<string, GraphNode> IndexNodes(GraphSnapshot graphSnapshot)
    {
        Dictionary<string, GraphNode> nodesById = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graphSnapshot.Nodes ?? [])
        {
            if (string.IsNullOrWhiteSpace(node.NodeId))
            {
                continue;
            }

            nodesById[node.NodeId.Trim()] = node;
        }

        return nodesById;
    }

    private static string ResolveLabel(GraphNode node) =>
        string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label.Trim();

    private static readonly IReadOnlyDictionary<string, string> EmptyProperties =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
}
