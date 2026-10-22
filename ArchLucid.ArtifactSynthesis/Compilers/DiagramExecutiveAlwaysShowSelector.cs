using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Picks the always-show resources (VMs, databases, storage accounts, data factories) for Executive mode (IDL-06).
/// Each visible tier is capped at <see cref="DiagramAstFromGraphCompilerConstants.ExecutiveAlwaysShowTierMaxNodes" />;
/// the remainder collapses into one synthetic <c>+N more …</c> node so the diagram stays one page for large tenants.
/// </summary>
internal static class DiagramExecutiveAlwaysShowSelector
{
    /// <summary>Marker property on synthetic rollup nodes so downstream stages can skip seed / ARM metadata.</summary>
    public const string OverflowMarkerProperty = "archlucid.executiveOverflow";

    private const string OverflowNodeIdPrefix = "executive-overflow-";

    public static List<GraphNode> Select(IReadOnlyList<GraphNode> orderedTopologyNodes, IReadOnlyList<string>? hiddenTierKeys)
    {
        ArgumentNullException.ThrowIfNull(orderedTopologyNodes);

        HashSet<string> hidden = (hiddenTierKeys ?? []).ToHashSet(StringComparer.OrdinalIgnoreCase);
        List<GraphNode> selected = [];

        foreach (ExecutiveAlwaysShowTier tier in ExecutiveAlwaysShowTiers.All)
        {
            if (hidden.Contains(tier.Key))
            {
                continue;
            }

            selected.AddRange(SelectTier(orderedTopologyNodes, tier));
        }

        return selected;
    }

    public static bool IsOverflowNode(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        return node.Properties.ContainsKey(OverflowMarkerProperty);
    }

    private static List<GraphNode> SelectTier(IReadOnlyList<GraphNode> orderedTopologyNodes, ExecutiveAlwaysShowTier tier)
    {
        List<GraphNode> members = orderedTopologyNodes
            .Where(node => BelongsToTier(node, tier))
            .ToList();

        // Input is already ARM-id ordered, so Take() keeps the alphabetically first resources — deterministic across renders.
        List<GraphNode> kept = members
            .Take(DiagramAstFromGraphCompilerConstants.ExecutiveAlwaysShowTierMaxNodes)
            .ToList();
        int overflowCount = members.Count - kept.Count;

        if (overflowCount > 0)
        {
            kept.Add(CreateOverflowNode(tier, overflowCount));
        }

        return kept;
    }

    private static bool BelongsToTier(GraphNode node, ExecutiveAlwaysShowTier tier)
    {
        ExecutiveAlwaysShowTier? resolved = ExecutiveAlwaysShowTiers.TryResolveByArmType(
            DiagramAstGraphNodeClassifier.ReadArmType(node));

        return resolved is not null && string.Equals(resolved.Key, tier.Key, StringComparison.Ordinal);
    }

    private static GraphNode CreateOverflowNode(ExecutiveAlwaysShowTier tier, int overflowCount)
    {
        return new GraphNode
        {
            NodeId = $"{OverflowNodeIdPrefix}{tier.Key}",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = $"+{overflowCount} more {tier.OverflowNoun}",
            Category = null,
            SourceType = null,
            SourceId = null,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [OverflowMarkerProperty] = tier.Key,
            },
        };
    }
}
