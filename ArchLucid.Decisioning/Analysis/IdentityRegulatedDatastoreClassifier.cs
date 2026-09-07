using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>Detects datastore topology nodes in a regulated theme (PCI/sensitive label or private-only baseline scope).</summary>
public static class IdentityRegulatedDatastoreClassifier
{
    public static bool IsRegulatedDatastore(GraphSnapshot graphSnapshot, GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(node);

        if (!IsDatastoreNode(node))
        {
            return false;
        }

        if (HasSensitiveLabel(node))
        {
            return true;
        }

        if (HasDataBearingSensitivity(node))
        {
            return true;
        }

        return IsProtectedByPrivateOnlyBaseline(graphSnapshot, node.NodeId);
    }

    public static bool IsDatastoreNode(GraphNode node)
    {
        if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (TryGetProperty(node.Properties, "category", out string? category)
            && (string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
                || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        string combined = $"{node.Label} {node.SourceId}".ToLowerInvariant();

        return combined.Contains("keyvault", StringComparison.Ordinal)
            || combined.Contains("key-vault", StringComparison.Ordinal)
            || combined.Contains("sql", StringComparison.Ordinal)
            || combined.Contains("storage", StringComparison.Ordinal)
            || combined.Contains("secret", StringComparison.Ordinal)
            || combined.Contains("cosmos", StringComparison.Ordinal)
            || combined.Contains("postgres", StringComparison.Ordinal)
            || combined.Contains("mysql", StringComparison.Ordinal)
            || combined.Contains("redis", StringComparison.Ordinal);
    }

    private static bool HasSensitiveLabel(GraphNode node)
    {
        string combined = $"{node.Label} {node.SourceId}".ToLowerInvariant();

        if (combined.Contains("pci", StringComparison.Ordinal)
            || combined.Contains("sensitive", StringComparison.Ordinal))
        {
            return true;
        }

        foreach (KeyValuePair<string, string> property in node.Properties)
        {
            if (property.Value.Contains("pci", StringComparison.OrdinalIgnoreCase)
                || property.Value.Contains("sensitive", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static bool HasDataBearingSensitivity(GraphNode node)
    {
        if (TryGetProperty(
                node.Properties,
                CanonicalGraphPropertyKeys.TopologySensitivity,
                out string? sensitivity)
            && string.Equals(sensitivity, TopologySensitivityLevels.DataBearing, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return TopologySensitivityClassifier.Classify(node.Label, node.Properties)
            == TopologySensitivityLevels.DataBearing;
    }

    private static bool IsProtectedByPrivateOnlyBaseline(GraphSnapshot graphSnapshot, string datastoreNodeId)
    {
        foreach (GraphNode baseline in graphSnapshot.GetNodesByType(GraphNodeTypes.SecurityBaseline))
        {
            if (!IsPrivateOnlyBaseline(baseline))
            {
                continue;
            }

            IReadOnlyList<GraphNode> protectedNodes = graphSnapshot.GetOutgoingTargets(
                baseline.NodeId,
                GraphEdgeTypes.Protects,
                GraphEdgeDecisioningThresholds.MinWeightForSemanticLink);

            if (protectedNodes.Any(node =>
                    string.Equals(node.NodeId, datastoreNodeId, StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }

            if (TryGetProperty(
                    baseline.Properties,
                    CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds,
                    out string? protectedIds)
                && protectedIds is not null
                && ContainsNodeId(protectedIds, datastoreNodeId))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsPrivateOnlyBaseline(GraphNode baseline)
    {
        baseline.Properties.TryGetValue("controlId", out string? controlId);

        string combined = $"{baseline.Label} {controlId}".ToLowerInvariant();

        return combined.Contains("private", StringComparison.Ordinal);
    }

    private static bool ContainsNodeId(string protectedIds, string nodeId)
    {
        foreach (string token in protectedIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (string.Equals(token, nodeId, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

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
