using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

using InventoryDataFlowStageResolver = ArchLucid.KnowledgeGraph.Inventory.AzureInventoryDataFlowStageResolver;

namespace ArchLucid.ArtifactSynthesis.Compilers;

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

        string primarySentence = hasObservedRuntime
            ? DiagramDataFlowHonestyLegend.ObservedRuntimeLeadingPrimarySentence
            : hasNonAdfFamilies
                ? DiagramDataFlowHonestyLegend.EvidenceFamiliesPrimarySentence
                : DiagramDataFlowHonestyLegend.DeclaredPipelinePrimarySentence;

        List<string> captions = [primarySentence];

        if (hasAuthorizedAccess)
        {
            captions.Add(DiagramDataFlowHonestyLegend.AuthorizedAccessBandSentence);
        }

        bool hasPrivateDnsVnetLink = includedEdges.Any(edge =>
            string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PrivateDnsVnetLink, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPrivateDnsVnet, StringComparison.OrdinalIgnoreCase));

        if (hasPeReachable && !hasPrivateDnsVnetLink)
        {
            captions.Add(DiagramDataFlowHonestyLegend.PrivateNetworkPathDnsSentence);
        }

        if (hasObservedRuntime)
        {
            List<GraphEdge> observedRuntimeEdges = includedEdges
                .Where(IsObservedRuntimeGraphEdge)
                .ToList();

            if (observedRuntimeEdges.Count > 0)
            {
                int withStoredWindow = observedRuntimeEdges.Count(edge =>
                    DiagramEdgeLabelHumanizer.ObservedDependencyHasStoredTimeWindow(edge.Properties));

                if (withStoredWindow == observedRuntimeEdges.Count)
                {
                    captions.Add(DiagramDataFlowHonestyLegend.ObservedRuntimeTimeWindowSentence);
                }
                else if (withStoredWindow == 0)
                {
                    captions.Add(DiagramDataFlowHonestyLegend.ObservedRuntimeTimeWindowZeroSentence);
                }
                else
                {
                    captions.Add(DiagramDataFlowHonestyLegend.ObservedRuntimeTimeWindowPartialSentence);
                }
            }
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
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.SynapseReadsFrom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.SynapseWritesTo, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, KnowledgeGraph.GraphEdgeInferenceSources.InventoryAdfReadsFrom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, KnowledgeGraph.GraphEdgeInferenceSources.InventoryAdfWritesTo, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, KnowledgeGraph.GraphEdgeInferenceSources.InventorySynapseReadsFrom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, KnowledgeGraph.GraphEdgeInferenceSources.InventorySynapseWritesTo, StringComparison.OrdinalIgnoreCase));

        bool hasLinkedServiceEdges = includedEdges.Any(edge =>
            string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AdfLinkedService, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.SynapseLinkedService, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.SynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase));

        if (hasIngestion && hasLinkedServiceEdges && !hasDirectionalEdges)
        {
            captions.Add(DiagramDataFlowHonestyLegend.PipelineDirectionMissingSentence);
        }

        List<string> omittedStages = [];

        foreach (string stage in AzureInventoryDataFlowStageNames.OrderedStages)
        {
            bool hasStageNode = includedNodes.Any(node =>
                AzureInventoryDataFlowStageNames.EqualsStage(
                    InventoryDataFlowStageResolver.Resolve(node),
                    stage));

            if (!hasStageNode)
                omittedStages.Add(stage);
        }

        if (omittedStages.Count == AzureInventoryDataFlowStageNames.OrderedStages.Count)
        {
            captions.Add(DiagramDataFlowHonestyLegend.NoResolvedDataFlowStageSentence);
        }
        else if (omittedStages.Count > 0)
        {
            captions.Add(
                $"{DiagramDataFlowHonestyLegend.OmittedDataFlowStagesSentencePrefix} {string.Join(", ", omittedStages)}.");
        }

        return captions;
    }

    private static bool IsObservedRuntimeGraphEdge(GraphEdge edge)
    {
        return (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.EdgeType, out AzureInventoryDataFlowEvidenceAssociation? fromType)
                && fromType is not null
                && fromType.Family == AzureInventoryDataFlowEvidenceFamily.ObservedRuntime)
            || (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.InferenceSource, out AzureInventoryDataFlowEvidenceAssociation? fromInference)
                && fromInference is not null
                && fromInference.Family == AzureInventoryDataFlowEvidenceFamily.ObservedRuntime);
    }
}
