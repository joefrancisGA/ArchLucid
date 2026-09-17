using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramDataFlowEdgeFilter
{
    private static readonly HashSet<string> AllowedAssociationTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        AzureInventoryRelationshipAssociationTypes.AdfReadsFrom,
        AzureInventoryRelationshipAssociationTypes.AdfWritesTo,
        AzureInventoryRelationshipAssociationTypes.AdfLinkedService,
        AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred,
        AzureInventoryRelationshipAssociationTypes.SynapseReadsFrom,
        AzureInventoryRelationshipAssociationTypes.SynapseWritesTo,
        AzureInventoryRelationshipAssociationTypes.SynapseLinkedService,
        AzureInventoryRelationshipAssociationTypes.SynapseLinkedServiceInferred,
    };

    public static bool IncludeEdge(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
        {
            return false;
        }

        if (string.Equals(edge.EdgeType, GraphEdgeTypes.Contains, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, GraphEdgeTypes.ContainsResource, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (AllowedAssociationTypes.Contains(edge.EdgeType))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(edge.InferenceSource)
            && AllowedAssociationTypes.Contains(edge.InferenceSource))
        {
            return true;
        }

        return GraphEdgeInferenceSources.IsInventoryAdfMovementInferenceSource(edge.InferenceSource);
    }
}

internal static class DiagramDataFlowCaptionBuilder
{
    public static IReadOnlyList<string> BuildCaptions(
        IReadOnlyList<GraphNode> includedNodes,
        IReadOnlyList<GraphEdge> includedEdges)
    {
        List<string> captions =
        [
            DiagramDataFlowHonestyLegend.PrimarySentence,
        ];

        bool hasIngestion = includedNodes.Any(node =>
            AzureInventoryDataFlowStageNames.EqualsStage(
                AzureInventoryDataFlowStageResolver.Resolve(node),
                AzureInventoryDataFlowStageNames.Ingestion));

        bool hasSource = includedNodes.Any(node =>
            AzureInventoryDataFlowStageNames.EqualsStage(
                AzureInventoryDataFlowStageResolver.Resolve(node),
                AzureInventoryDataFlowStageNames.Source));

        bool hasStorage = includedNodes.Any(node =>
            AzureInventoryDataFlowStageNames.EqualsStage(
                AzureInventoryDataFlowStageResolver.Resolve(node),
                AzureInventoryDataFlowStageNames.Storage));

        if (hasIngestion && !hasSource && !hasStorage)
        {
            captions.Add(DiagramDataFlowHonestyLegend.NoResolvedStoresOrSourcesSentence);
        }

        bool hasDirectionalEdges = includedEdges.Any(edge =>
            string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AdfReadsFrom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AdfWritesTo, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, KnowledgeGraph.GraphEdgeInferenceSources.InventoryAdfReadsFrom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, KnowledgeGraph.GraphEdgeInferenceSources.InventoryAdfWritesTo, StringComparison.OrdinalIgnoreCase));

        bool hasLinkedServiceEdges = includedEdges.Any(edge =>
            string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AdfLinkedService, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase));

        if (hasIngestion && hasLinkedServiceEdges && !hasDirectionalEdges)
        {
            captions.Add(DiagramDataFlowHonestyLegend.PipelineDirectionMissingSentence);
        }

        return captions;
    }
}

internal static class DiagramDataFlowStageSubgraphPlanner
{
    public static IReadOnlyList<DiagramSubgraph> PlanSubgraphs(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        List<DiagramSubgraph> subgraphs = [];
        int order = 0;

        foreach (string stage in AzureInventoryDataFlowStageNames.OrderedStages)
        {
            bool hasNodes = nodes.Any(node =>
                AzureInventoryDataFlowStageNames.EqualsStage(
                    AzureInventoryDataFlowStageResolver.Resolve(node),
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

    public static string? ResolveSubgraphId(GraphNode node, IReadOnlyList<DiagramSubgraph> subgraphs)
    {
        ArgumentNullException.ThrowIfNull(node);
        ArgumentNullException.ThrowIfNull(subgraphs);

        string? stage = AzureInventoryDataFlowStageResolver.Resolve(node);

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
        string? stage = AzureInventoryDataFlowStageResolver.Resolve(node);

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
