using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Materializes confirmed assumptions as <see cref="GraphNodeTypes.Assumption" /> nodes (TB-2347).
/// </summary>
public static class RequestAssumptionMaterializer
{
    public static IReadOnlyList<GraphNode> MaterializeFromAssumptionsMetadata(
        string? assumptionsPipeSeparated,
        Guid snapshotId)
    {
        if (string.IsNullOrWhiteSpace(assumptionsPipeSeparated))
            return [];

        List<GraphNode> nodes = [];
        int index = 0;

        foreach (string rawAssumption in assumptionsPipeSeparated.Split(
                     '|',
                     StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            index++;
            string label = rawAssumption.Length <= 96 ? rawAssumption : $"{rawAssumption[..93]}...";

            nodes.Add(new GraphNode
            {
                NodeId = $"assumption-{snapshotId:N}-{index}",
                NodeType = GraphNodeTypes.Assumption,
                Label = label,
                SourceType = "StructuredBriefAssumption",
                SourceId = snapshotId.ToString(),
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["assumptionText"] = rawAssumption,
                    ["source"] = "structured-brief",
                },
            });
        }

        return nodes;
    }
}
