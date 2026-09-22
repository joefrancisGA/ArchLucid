using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;
using InventoryDataFlowStageResolver = ArchLucid.KnowledgeGraph.Inventory.AzureInventoryDataFlowStageResolver;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramDataFlowEdgeFilter
{
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

        return AzureInventoryDataFlowEvidenceCatalog.IncludeOnDataFlow(edge.EdgeType, edge.InferenceSource);
    }
}

internal static class DiagramDataFlowCaptionBuilder
{
    public static IReadOnlyList<string> BuildCaptions(
        IReadOnlyList<GraphNode> includedNodes,
        IReadOnlyList<GraphEdge> includedEdges)
    {
        bool hasAuthorizedAccess = includedEdges.Any(edge =>
            (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.EdgeType, out AzureInventoryDataFlowEvidenceAssociation? fromType)
                && fromType is not null
                && fromType.Family == AzureInventoryDataFlowEvidenceFamily.AuthorizedAccess)
            || (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.InferenceSource, out AzureInventoryDataFlowEvidenceAssociation? fromInference)
                && fromInference is not null
                && fromInference.Family == AzureInventoryDataFlowEvidenceFamily.AuthorizedAccess));

        bool hasPeReachable = includedEdges.Any(edge =>
            string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeReachableTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPeReachableTarget, StringComparison.OrdinalIgnoreCase));

        bool hasObservedRuntime = includedEdges.Any(edge =>
            (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.EdgeType, out AzureInventoryDataFlowEvidenceAssociation? observedType)
                && observedType is not null
                && observedType.Family == AzureInventoryDataFlowEvidenceFamily.ObservedRuntime)
            || (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.InferenceSource, out AzureInventoryDataFlowEvidenceAssociation? observedInference)
                && observedInference is not null
                && observedInference.Family == AzureInventoryDataFlowEvidenceFamily.ObservedRuntime));

        bool hasNonAdfFamilies = hasAuthorizedAccess
            || hasPeReachable
            || hasObservedRuntime
            || includedEdges.Any(edge =>
                (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.EdgeType, out AzureInventoryDataFlowEvidenceAssociation? evidence)
                    && evidence is not null
                    && evidence.Family is AzureInventoryDataFlowEvidenceFamily.StructuralNetworkPath
                        or AzureInventoryDataFlowEvidenceFamily.InferredHostname)
                || (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.InferenceSource, out AzureInventoryDataFlowEvidenceAssociation? inferred)
                    && inferred is not null
                    && inferred.Family is AzureInventoryDataFlowEvidenceFamily.StructuralNetworkPath
                        or AzureInventoryDataFlowEvidenceFamily.InferredHostname));

        List<string> captions =
        [
            hasNonAdfFamilies
                ? DiagramDataFlowHonestyLegend.EvidenceFamiliesPrimarySentence
                : DiagramDataFlowHonestyLegend.DeclaredPipelinePrimarySentence,
        ];

        if (hasAuthorizedAccess)
        {
            captions.Add(DiagramDataFlowHonestyLegend.AuthorizedAccessBandSentence);
        }

        if (hasPeReachable)
        {
            captions.Add(DiagramDataFlowHonestyLegend.PrivateNetworkPathDnsSentence);
        }

        if (hasObservedRuntime)
        {
            captions.Add(DiagramDataFlowHonestyLegend.ObservedRuntimeTimeWindowSentence);
        }

        bool hasIngestion = includedNodes.Any(node =>
            AzureInventoryDataFlowStageNames.EqualsStage(
                InventoryDataFlowStageResolver.Resolve(node),
                AzureInventoryDataFlowStageNames.Ingestion));

        bool hasSource = includedNodes.Any(node =>
            AzureInventoryDataFlowStageNames.EqualsStage(
                InventoryDataFlowStageResolver.Resolve(node),
                AzureInventoryDataFlowStageNames.Source));

        bool hasStorage = includedNodes.Any(node =>
            AzureInventoryDataFlowStageNames.EqualsStage(
                InventoryDataFlowStageResolver.Resolve(node),
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
                    InventoryDataFlowStageResolver.Resolve(node),
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

        string? stage = InventoryDataFlowStageResolver.Resolve(node);

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
