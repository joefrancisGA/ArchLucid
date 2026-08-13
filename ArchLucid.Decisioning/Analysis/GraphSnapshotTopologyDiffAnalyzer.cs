using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

public sealed class TopologyCategoryDiffResult
{
    public List<string> AddedCategories
    {
        get;
        set;
    } = [];

    public List<string> RemovedCategories
    {
        get;
        set;
    } = [];

    public List<string> PriorCategories
    {
        get;
        set;
    } = [];

    public List<string> CurrentCategories
    {
        get;
        set;
    } = [];
}

public static class GraphSnapshotTopologyDiffAnalyzer
{
    public static TopologyCategoryDiffResult AnalyzeCategoryDelta(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        TopologyCategoryDiffResult result = new()
        {
            CurrentCategories = ExtractTopologyCategories(graphSnapshot)
        };

        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(n =>
            string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        if (contextNode is null
            || !contextNode.Properties.TryGetValue(ContextGraphPropertyKeys.PriorTopologyCategories, out string? priorRaw)
            || string.IsNullOrWhiteSpace(priorRaw))
        {
            return result;
        }

        result.PriorCategories = priorRaw
            .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static c => c, StringComparer.OrdinalIgnoreCase)
            .ToList();

        HashSet<string> prior = result.PriorCategories.ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<string> current = result.CurrentCategories.ToHashSet(StringComparer.OrdinalIgnoreCase);

        result.AddedCategories = current.Except(prior, StringComparer.OrdinalIgnoreCase).OrderBy(static c => c, StringComparer.OrdinalIgnoreCase).ToList();
        result.RemovedCategories = prior.Except(current, StringComparer.OrdinalIgnoreCase).OrderBy(static c => c, StringComparer.OrdinalIgnoreCase).ToList();

        return result;
    }

    private static List<string> ExtractTopologyCategories(GraphSnapshot graphSnapshot)
    {
        return graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource)
            .Select(static n => n.Category ?? "general")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static c => c, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
