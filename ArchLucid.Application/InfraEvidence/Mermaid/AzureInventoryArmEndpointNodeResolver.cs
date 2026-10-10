using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Maps relationship ARM ids onto graph nodes, including nested children whose
///     parent is on the canvas (subnet → VNet) when the child was never a snapshot row.
/// </summary>
internal static class AzureInventoryArmEndpointNodeResolver
{
    public static bool TryResolveExactOrAncestorNodeId(
        IReadOnlyDictionary<string, string> nodeIdByArmId,
        string armId,
        out string nodeId)
    {
        nodeId = string.Empty;

        if (string.IsNullOrWhiteSpace(armId) || nodeIdByArmId is null)
        {
            return false;
        }

        // Exact resource first, followed by its ancestors from nearest to farthest.
        foreach (string candidate in ArmResourceIdNormalizer.EnumerateAncestorResourceIds(armId).Prepend(armId))
        {
            if (nodeIdByArmId.TryGetValue(candidate, out string? candidateNodeId)
                && !string.IsNullOrWhiteSpace(candidateNodeId))
            {
                nodeId = candidateNodeId;

                return true;
            }
        }

        return false;
    }

    public static IReadOnlyList<string> ResolveRelatedNodeIds(
        IReadOnlyDictionary<string, string> nodeIdByArmId,
        string armId)
    {
        HashSet<string> nodeIds = new(StringComparer.Ordinal);

        if (string.IsNullOrWhiteSpace(armId) || nodeIdByArmId is null)
        {
            return [];
        }

        if (nodeIdByArmId.TryGetValue(armId, out string? exactNodeId)
            && !string.IsNullOrWhiteSpace(exactNodeId))
        {
            nodeIds.Add(exactNodeId);
        }

        string childPrefix = armId.TrimEnd('/') + "/";

        foreach (KeyValuePair<string, string> pair in nodeIdByArmId)
        {
            if (pair.Key.StartsWith(childPrefix, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(pair.Value))
            {
                nodeIds.Add(pair.Value);
            }
        }

        if (nodeIds.Count > 0)
        {
            return nodeIds.ToList();
        }

        if (TryResolveExactOrAncestorNodeId(nodeIdByArmId, armId, out string ancestorNodeId))
        {
            nodeIds.Add(ancestorNodeId);
        }

        return nodeIds.ToList();
    }
}
