using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Findings;

/// <summary>Matches inventory secret/vault names to topology or declaration graph nodes (DX-09).</summary>
public static class SecretsLifecycleGraphMatcher
{
    public sealed record MatchResult(bool IsReferenced, string? MatchedNodeId);

    public static MatchResult TryMatch(GraphSnapshot graphSnapshot, string secretName, string vaultName)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return new MatchResult(false, null);
        }

        IReadOnlyList<string> searchTokens = BuildSearchTokens(secretName, vaultName);

        if (searchTokens.Count == 0)
        {
            return new MatchResult(false, null);
        }

        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (!IsEligibleNode(node))
            {
                continue;
            }

            if (NodeMatchesTokens(node, searchTokens))
            {
                return new MatchResult(true, node.NodeId);
            }
        }

        return new MatchResult(false, null);
    }

    private static bool IsEligibleNode(GraphNode node)
    {
        if (node is null || string.IsNullOrWhiteSpace(node.NodeType))
        {
            return false;
        }

        return string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase)
            || string.Equals(node.NodeType, GraphNodeTypes.SecurityBaseline, StringComparison.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<string> BuildSearchTokens(string secretName, string vaultName)
    {
        List<string> tokens = [];

        AddToken(tokens, secretName);
        AddToken(tokens, vaultName);

        return tokens;
    }

    private static void AddToken(List<string> tokens, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        string trimmed = value.Trim();

        if (trimmed.Length < 3)
        {
            return;
        }

        if (!tokens.Contains(trimmed, StringComparer.OrdinalIgnoreCase))
        {
            tokens.Add(trimmed);
        }
    }

    private static bool NodeMatchesTokens(GraphNode node, IReadOnlyList<string> searchTokens)
    {
        foreach (string token in searchTokens)
        {
            if (TokenMatchesNode(token, node))
            {
                return true;
            }
        }

        return false;
    }

    private static bool TokenMatchesNode(string token, GraphNode node)
    {
        if (string.Equals(node.Label, token, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(node.NodeId, token, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(node.SourceId)
            && (string.Equals(node.SourceId, token, StringComparison.OrdinalIgnoreCase)
                || node.SourceId.EndsWith('/' + token, StringComparison.OrdinalIgnoreCase)
                || node.SourceId.Contains('/' + token + '/', StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        if (node.Properties is null || node.Properties.Count == 0)
        {
            return false;
        }

        foreach (KeyValuePair<string, string> property in node.Properties)
        {
            if (string.IsNullOrWhiteSpace(property.Value))
            {
                continue;
            }

            if (string.Equals(property.Value.Trim(), token, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (property.Value.Contains(token, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
