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

            if (!datasetByKey.TryGetValue(BuildDatasetKey(flow.FactoryResourceId, flow.DatasetName), out AzureInventoryAdfDatasetRow? dataset))
            {
                warnings.Add($"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.TargetUnresolvedPrefix}{flow.DatasetName}");

                continue;
            }

            if (!linkedServiceByKey.TryGetValue(
                    BuildLinkedServiceKey(flow.FactoryResourceId, dataset.LinkedServiceName),
                    out AzureInventoryAdfLinkedServiceRow? linkedService))
            {
                warnings.Add($"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.TargetUnresolvedPrefix}{dataset.LinkedServiceName}");

                continue;
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
                if (!string.IsNullOrWhiteSpace(linkedService.WarningCode))
                {
                    warnings.Add(linkedService.WarningCode);
                }

                continue;
            }

            string associationType = flow.FlowDirection.Equals(AzureInventoryAdfPipelineFlowDirection.Write, StringComparison.OrdinalIgnoreCase)
                ? AzureInventoryRelationshipAssociationTypes.AdfWritesTo
                : AzureInventoryRelationshipAssociationTypes.AdfReadsFrom;

            string inferenceSource = associationType.Equals(AzureInventoryRelationshipAssociationTypes.AdfWritesTo, StringComparison.OrdinalIgnoreCase)
                ? GraphEdgeInferenceSources.InventoryAdfWritesTo
                : GraphEdgeInferenceSources.InventoryAdfReadsFrom;

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
