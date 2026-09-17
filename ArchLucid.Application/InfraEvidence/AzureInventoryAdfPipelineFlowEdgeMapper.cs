using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps declared ADF pipeline activity flows to directional snapshot relationships.
/// </summary>
internal static class AzureInventoryAdfPipelineFlowEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;

    public static void MapPipelineFlows(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<AzureInventoryAdfDatasetRow> datasets,
        IReadOnlyList<AzureInventoryAdfLinkedServiceRow> linkedServices,
        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> pipelineFlows,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        HashSet<string> directionalFactoryTargetPairs,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(datasets);
        ArgumentNullException.ThrowIfNull(linkedServices);
        ArgumentNullException.ThrowIfNull(pipelineFlows);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(directionalFactoryTargetPairs);
        ArgumentNullException.ThrowIfNull(warnings);

        Dictionary<string, string> visibleArmIds = AzureInventoryAdfLinkedServiceTargetResolver.BuildVisibleArmIdSet(resources);
        Dictionary<string, string> hostToArmId = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        Dictionary<string, AzureInventoryAdfDatasetRow> datasetByKey = datasets
            .Where(row => row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded, StringComparison.OrdinalIgnoreCase))
            .ToDictionary(
                row => BuildDatasetKey(row.FactoryResourceId, row.DatasetName),
                StringComparer.OrdinalIgnoreCase);

        Dictionary<string, AzureInventoryAdfLinkedServiceRow> linkedServiceByKey = linkedServices
            .Where(row => row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded, StringComparison.OrdinalIgnoreCase)
                          || row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved, StringComparison.OrdinalIgnoreCase))
            .ToDictionary(
                row => BuildLinkedServiceKey(row.FactoryResourceId, row.LinkedServiceName),
                StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryAdfPipelineFlowRow flow in pipelineFlows)
        {
            if (!flow.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded, StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(flow.WarningCode))
                {
                    warnings.Add(flow.WarningCode);
                }

                continue;
            }

            AzureInventoryAdfLinkedServiceRow? linkedService = null;

            if (TryResolveLinkedServiceNameFromFlow(flow, out string? linkedServiceName))
            {
                if (!linkedServiceByKey.TryGetValue(
                        BuildLinkedServiceKey(flow.FactoryResourceId, linkedServiceName!),
                        out linkedService))
                {
                    warnings.Add($"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.TargetUnresolvedPrefix}{linkedServiceName}");

                    continue;
                }
            }
            else
            {
                if (!datasetByKey.TryGetValue(BuildDatasetKey(flow.FactoryResourceId, flow.DatasetName), out AzureInventoryAdfDatasetRow? dataset))
                {
                    warnings.Add($"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.TargetUnresolvedPrefix}{flow.DatasetName}");

                    continue;
                }

                if (!linkedServiceByKey.TryGetValue(
                        BuildLinkedServiceKey(flow.FactoryResourceId, dataset.LinkedServiceName),
                        out linkedService))
                {
                    warnings.Add($"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.TargetUnresolvedPrefix}{dataset.LinkedServiceName}");

                    continue;
                }
            }

            if (!AzureInventoryAdfLinkedServiceTargetResolver.TryResolveTargetArmId(
                    linkedService,
                    visibleArmIds,
                    hostToArmId,
                    out string? targetArmId,
                    out _,
                    out _)
                || string.IsNullOrWhiteSpace(targetArmId))
            {
                if (!AzureInventoryAdfExternalSourceNodeFactory.TryResolveExternalTargetArmId(linkedService, out string externalNodeKey))
                {
                    if (!string.IsNullOrWhiteSpace(linkedService.WarningCode))
                    {
                        warnings.Add(linkedService.WarningCode);
                    }

                    continue;
                }

                targetArmId = externalNodeKey;
            }

            string associationType = flow.FlowDirection.Equals(AzureInventoryAdfPipelineFlowDirection.Write, StringComparison.OrdinalIgnoreCase)
                ? AzureInventoryPipelineStyleEdgeAssociationSelector.SelectWritesToAssociationType(flow.FactoryResourceId)
                : AzureInventoryPipelineStyleEdgeAssociationSelector.SelectReadsFromAssociationType(flow.FactoryResourceId);

            string inferenceSource = ResolvePipelineFlowInferenceSource(associationType);

            string normalizedFactoryId = ArmResourceIdNormalizer.Normalize(flow.FactoryResourceId);

            AddRelationship(
                relationships,
                relationshipKeys,
                normalizedFactoryId,
                targetArmId,
                associationType,
                ProvenanceKind.DerivedFact,
                DerivedFactConfidence,
                inferenceSource);

            directionalFactoryTargetPairs.Add(BuildDirectionalPairKey(normalizedFactoryId, targetArmId));
        }
    }

    private static string ResolvePipelineFlowInferenceSource(string associationType)
    {
        if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.SynapseWritesTo, StringComparison.OrdinalIgnoreCase))
        {
            return GraphEdgeInferenceSources.InventorySynapseWritesTo;
        }

        if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.SynapseReadsFrom, StringComparison.OrdinalIgnoreCase))
        {
            return GraphEdgeInferenceSources.InventorySynapseReadsFrom;
        }

        if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.AdfWritesTo, StringComparison.OrdinalIgnoreCase))
        {
            return GraphEdgeInferenceSources.InventoryAdfWritesTo;
        }

        return GraphEdgeInferenceSources.InventoryAdfReadsFrom;
    }

    private static bool TryResolveLinkedServiceNameFromFlow(
        AzureInventoryAdfPipelineFlowRow flow,
        out string? linkedServiceName)
    {
        linkedServiceName = null;

        if (!flow.DatasetName.StartsWith("__linkedService:", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        linkedServiceName = flow.DatasetName["__linkedService:".Length..].Trim();

        return !string.IsNullOrWhiteSpace(linkedServiceName);
    }

    public static string BuildDirectionalPairKey(string factoryArmId, string targetArmId)
    {
        return $"{factoryArmId}|{targetArmId}";
    }

    private static string BuildDatasetKey(string factoryResourceId, string datasetName)
    {
        return $"{factoryResourceId.Trim()}|{datasetName.Trim()}";
    }

    private static string BuildLinkedServiceKey(string factoryResourceId, string linkedServiceName)
    {
        return $"{factoryResourceId.Trim()}|{linkedServiceName.Trim()}";
    }

    private static void AddRelationship(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromAzureResourceId,
        string toAzureResourceId,
        string relationshipType,
        ProvenanceKind provenanceKind,
        decimal confidence,
        string inferenceSource)
    {
        string key = $"{fromAzureResourceId}|{relationshipType}|{toAzureResourceId}|{(int)provenanceKind}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = fromAzureResourceId,
            ToAzureResourceId = toAzureResourceId,
            RelationshipType = relationshipType,
            ProvenanceKind = provenanceKind,
            Confidence = confidence,
            InferenceSource = inferenceSource,
        });
    }
}
