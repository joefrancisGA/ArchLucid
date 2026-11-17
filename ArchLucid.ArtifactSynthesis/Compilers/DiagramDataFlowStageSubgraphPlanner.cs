using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramDataFlowStageSubgraphPlanner
{
    public static IReadOnlyList<DiagramSubgraph> PlanSubgraphs(
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyDictionary<string, string> stageOverrides)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(stageOverrides);

        List<DiagramSubgraph> subgraphs = [];
        int order = 0;

        foreach (string stage in AzureInventoryDataFlowStageNames.OrderedStages)
        {
            bool hasNodes = nodes.Any(node =>
                AzureInventoryDataFlowStageNames.EqualsStage(
                    DiagramDataFlowEffectiveStageResolver.ResolveStage(node, stageOverrides),
                    stage));

            if (!hasNodes)
            {
                continue;
            }

            subgraphs.Add(new DiagramSubgraph
            {
                SubgraphId = BuildSubgraphId(stage),
                Label = stage,
                OrderKey = order++,
            });
        }

        return subgraphs;
    }

    public static string? ResolveSubgraphId(
        GraphNode node,
        IReadOnlyList<DiagramSubgraph> subgraphs,
        IReadOnlyDictionary<string, string> stageOverrides)
    {
        ArgumentNullException.ThrowIfNull(node);
        ArgumentNullException.ThrowIfNull(subgraphs);
        ArgumentNullException.ThrowIfNull(stageOverrides);

        string? stage = DiagramDataFlowEffectiveStageResolver.ResolveStage(node, stageOverrides);

        if (string.IsNullOrWhiteSpace(stage))
        {
            return null;
        }

        string subgraphId = BuildSubgraphId(stage);

        return subgraphs.Any(subgraph => string.Equals(subgraph.SubgraphId, subgraphId, StringComparison.Ordinal))
            ? subgraphId
            : null;
    }

    private static string BuildSubgraphId(string stage)
    {
        return $"data-flow-stage-{stage.ToLowerInvariant()}";
    }
}
