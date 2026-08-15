using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

public sealed class RequirementNameDiffResult
{
    public List<string> AddedRequirementNames
    {
        get;
        set;
    } = [];

    public List<string> RemovedRequirementNames
    {
        get;
        set;
    } = [];

    public List<string> PriorRequirementNames
    {
        get;
        set;
    } = [];

    public List<string> CurrentRequirementNames
    {
        get;
        set;
    } = [];
}

public static class GraphSnapshotRequirementDiffAnalyzer
{
    public static RequirementNameDiffResult AnalyzeNameDelta(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        RequirementNameDiffResult result = new()
        {
            CurrentRequirementNames = ExtractRequirementNames(graphSnapshot)
        };

        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(n =>
            string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        if (contextNode is null
            || !contextNode.Properties.TryGetValue(ContextGraphPropertyKeys.PriorRequirementNames, out string? priorRaw)
            || string.IsNullOrWhiteSpace(priorRaw))
        {
            return result;
        }

        result.PriorRequirementNames = priorRaw
            .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        HashSet<string> prior = result.PriorRequirementNames.ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<string> current = result.CurrentRequirementNames.ToHashSet(StringComparer.OrdinalIgnoreCase);

        result.AddedRequirementNames = current.Except(prior, StringComparer.OrdinalIgnoreCase)
            .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();
        result.RemovedRequirementNames = prior.Except(current, StringComparer.OrdinalIgnoreCase)
            .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return result;
    }

    private static List<string> ExtractRequirementNames(GraphSnapshot graphSnapshot)
    {
        return graphSnapshot.GetNodesByType(GraphNodeTypes.Requirement)
            .Select(static node => node.Label)
            .Where(static label => !string.IsNullOrWhiteSpace(label))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static label => label, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
