using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Collects resolvable inventory citations from topology graph node property bags.</summary>
public static class FindingGraphEvidenceRefs
{
    public static List<string> CollectFromNodeIds(GraphSnapshot graphSnapshot, IEnumerable<string> nodeIds)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(nodeIds);

        List<string> evidenceRefs = [];
        HashSet<string> nodeIdSet = nodeIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (nodeIdSet.Count == 0)
            return evidenceRefs;

        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (!nodeIdSet.Contains(node.NodeId))
                continue;

            FindingEvidenceRefs.TryCollectFromNodeProperties(evidenceRefs, node.Properties);
        }

        return evidenceRefs;
    }
}
