using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Inventory;

using InventoryDataFlowStageResolver = ArchLucid.KnowledgeGraph.Inventory.AzureInventoryDataFlowStageResolver;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramDataArchitectureTypeGroupPlanner
{
    public static IReadOnlyList<DiagramSubgraph> PlanSubgraphs(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        List<(string SubgraphId, string Label, int OrderKey)> groups =
        [
            ("data-arch-databases", "Databases", 0),
            ("data-arch-storage", "Storage", 1),
            ("data-arch-integration", "Integration", 2),
            ("data-arch-transform", "Transform", 3),
            ("data-arch-consumer", "Consumer", 4),
            ("data-arch-source", "Source", 5),
        ];

        List<DiagramSubgraph> subgraphs = [];

        foreach ((string subgraphId, string label, int orderKey) in groups)
        {
            bool hasNodes = nodes.Any(node => string.Equals(ResolveGroupId(node), subgraphId, StringComparison.Ordinal));

            if (!hasNodes)
            {
                continue;
            }

            subgraphs.Add(new DiagramSubgraph
            {
                SubgraphId = subgraphId,
                Label = label,
                OrderKey = orderKey,
            });
        }

        return subgraphs;
    }

    public static string? ResolveSubgraphId(GraphNode node, IReadOnlyList<DiagramSubgraph> subgraphs)
    {
        ArgumentNullException.ThrowIfNull(node);
        ArgumentNullException.ThrowIfNull(subgraphs);

        string? groupId = ResolveGroupId(node);

        if (string.IsNullOrWhiteSpace(groupId))
        {
            return null;
        }

        return subgraphs.Any(subgraph => string.Equals(subgraph.SubgraphId, groupId, StringComparison.Ordinal))
            ? groupId
            : null;
    }

    private static string? ResolveGroupId(GraphNode node)
    {
        string? stage = InventoryDataFlowStageResolver.Resolve(node);

        if (AzureInventoryDataFlowStageNames.EqualsStage(stage, AzureInventoryDataFlowStageNames.Source))
        {
            return "data-arch-source";
        }

        if (AzureInventoryDataFlowStageNames.EqualsStage(stage, AzureInventoryDataFlowStageNames.Ingestion))
        {
            return "data-arch-integration";
        }

        if (AzureInventoryDataFlowStageNames.EqualsStage(stage, AzureInventoryDataFlowStageNames.Storage))
        {
            string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

            if (armType.StartsWith("Microsoft.Storage/", StringComparison.OrdinalIgnoreCase))
            {
                return "data-arch-storage";
            }

            return "data-arch-databases";
        }

        if (AzureInventoryDataFlowStageNames.EqualsStage(stage, AzureInventoryDataFlowStageNames.Transform))
        {
            return "data-arch-transform";
        }

        if (AzureInventoryDataFlowStageNames.EqualsStage(stage, AzureInventoryDataFlowStageNames.Consumer))
        {
            return "data-arch-consumer";
        }

        return null;
    }
}
