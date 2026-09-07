using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Findings;

/// <summary>Joins open commitments to topology nodes on the current graph snapshot.</summary>
public static class OpenCommitmentTopologyJoiner
{
    public sealed record JoinResult(bool TopologyMatch, GraphNode? MatchedNode);

    public static JoinResult TryJoin(
        GraphSnapshot graphSnapshot,
        FindingInspectResponse? inspect,
        FindingReviewEventRecord? trailEvent)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        IReadOnlyList<GraphNode> topologyNodes = ReadTopologyNodes(graphSnapshot);

        if (topologyNodes.Count == 0)
        {
            return new JoinResult(false, null);
        }

        Dictionary<string, GraphNode> topologyNodesById = topologyNodes
            .Where(static node => !string.IsNullOrWhiteSpace(node.NodeId))
            .GroupBy(static node => node.NodeId.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase);

        foreach (string nodeIdHint in OpenCommitmentCommitmentTextCollector.CollectRelatedNodeIdHints(inspect))
        {
            if (topologyNodesById.TryGetValue(nodeIdHint, out GraphNode? hintedNode))
            {
                return new JoinResult(true, hintedNode);
            }
        }

        IReadOnlyList<string> textSegments = OpenCommitmentCommitmentTextCollector.CollectTextSegments(inspect, trailEvent);
        IReadOnlyList<string> resourceTokens = OpenCommitmentCommitmentTextCollector.ExtractResourceTokens(textSegments);
        string combinedText = string.Join(' ', textSegments);

        foreach (GraphNode node in topologyNodes)
        {
            if (NodeMatchesTokens(node, resourceTokens, combinedText))
            {
                return new JoinResult(true, node);
            }
        }

        return new JoinResult(false, null);
    }

    private static IReadOnlyList<GraphNode> ReadTopologyNodes(GraphSnapshot graphSnapshot)
    {
        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return [];
        }

        return graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);
    }

    private static bool NodeMatchesTokens(GraphNode node, IReadOnlyList<string> resourceTokens, string combinedText)
    {
        string? label = Normalize(node.Label);
        string? sourceId = Normalize(node.SourceId);
        string? nodeId = Normalize(node.NodeId);

        foreach (string token in resourceTokens)
        {
            string normalizedToken = token.Trim();

            if (normalizedToken.Length < 3)
            {
                continue;
            }

            if (string.Equals(label, normalizedToken, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (string.Equals(nodeId, normalizedToken, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (sourceId is not null
                && (string.Equals(sourceId, normalizedToken, StringComparison.OrdinalIgnoreCase)
                    || sourceId.EndsWith('/' + normalizedToken, StringComparison.OrdinalIgnoreCase)
                    || sourceId.Contains('/' + normalizedToken + '/', StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }
        }

        if (label is not null
            && label.Length >= 4
            && combinedText.Contains(label, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}
