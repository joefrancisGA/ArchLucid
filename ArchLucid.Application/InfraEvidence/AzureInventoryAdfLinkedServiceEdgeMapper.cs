using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps normalized ADF linked-service rows to snapshot relationships.
/// </summary>
internal static class AzureInventoryAdfLinkedServiceEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;
    private const decimal DeterministicInferenceConfidence = 0.8m;

    public static void MapLinkedServices(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<AzureInventoryAdfLinkedServiceRow> linkedServices,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        HashSet<string> directionalFactoryTargetPairs,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(linkedServices);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(directionalFactoryTargetPairs);
        ArgumentNullException.ThrowIfNull(warnings);

        Dictionary<string, string> visibleArmIds = AzureInventoryAdfLinkedServiceTargetResolver.BuildVisibleArmIdSet(resources);
        Dictionary<string, string> hostToArmId = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        bool hasFactory = resources.Any(resource =>
            AzureInventoryFactoryStyleResourceCatalog.IsFactoryStyleResourceType(resource.ResourceType));

        int successfulRows = 0;

        foreach (AzureInventoryAdfLinkedServiceRow row in linkedServices)
        {
            if (row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.Forbidden, StringComparison.OrdinalIgnoreCase)
                || row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.NotFound, StringComparison.OrdinalIgnoreCase)
                || row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.Throttled, StringComparison.OrdinalIgnoreCase)
                || row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.MalformedPayload, StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(row.WarningCode))
                {
                    warnings.Add(row.WarningCode);
                }

                continue;
            }

            if (row.LinkedServiceName.Equals("_collection_failed", StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(row.WarningCode))
                {
                    warnings.Add(row.WarningCode);
                }

                continue;
            }

            if (!AzureInventoryAdfLinkedServiceTargetResolver.TryResolveTargetArmId(
                    row,
                    visibleArmIds,
                    hostToArmId,
                    out string? targetArmId,
                    out ProvenanceKind provenanceKind,
                    out string associationType)
                || string.IsNullOrWhiteSpace(targetArmId))
            {
                if (!string.IsNullOrWhiteSpace(row.WarningCode))
                {
                    warnings.Add(row.WarningCode);
                }

                continue;
            }

            if (!AzureInventoryRelationshipAssociationTypes.TryGet(associationType, out AzureInventoryRelationshipAssociationTypeDefinition? definition)
                || definition is null)
            {
                continue;
            }

            string normalizedFactoryId = ArmResourceIdNormalizer.Normalize(row.FactoryResourceId);
            string pairKey = AzureInventoryAdfPipelineFlowEdgeMapper.BuildDirectionalPairKey(normalizedFactoryId, targetArmId);

            if (directionalFactoryTargetPairs.Contains(pairKey))
            {
                continue;
            }

            decimal confidence = provenanceKind == ProvenanceKind.ObservedFact
                ? ObservedFactConfidence
                : DeterministicInferenceConfidence;

            string inferenceSource = ResolveLinkedServiceInferenceSource(associationType);

            AddRelationship(
                relationships,
                relationshipKeys,
                normalizedFactoryId,
                targetArmId,
                associationType,
                provenanceKind,
                confidence,
                inferenceSource);

            successfulRows++;
        }

        if (hasFactory && successfulRows == 0 && linkedServices.Count == 0)
        {
            warnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.AdfFactoryHasNoLinkedServices);
        }
    }

    private static string ResolveLinkedServiceInferenceSource(string associationType)
    {
        if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase))
        {
            return GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred;
        }

        if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.SynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase))
        {
            return GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred;
        }

        if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.SynapseLinkedService, StringComparison.OrdinalIgnoreCase))
        {
            return GraphEdgeInferenceSources.InventorySynapseLinkedService;
        }

        return GraphEdgeInferenceSources.InventoryAdfLinkedService;
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
