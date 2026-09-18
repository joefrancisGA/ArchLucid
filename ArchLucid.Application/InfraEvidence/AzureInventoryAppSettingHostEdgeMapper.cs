using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps redacted App Service setting host rows to inferred relationships (AX-DE-18).
/// </summary>
internal static class AzureInventoryAppSettingHostEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;
    private const decimal DeterministicInferenceConfidence = 0.8m;

    public static void MapHosts(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<AzureInventoryAppSettingHostRow> rows,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        Dictionary<string, string> hostToArmId = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        foreach (AzureInventoryAppSettingHostRow row in rows)
        {
            if (!row.CollectionStatus.Equals(
                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(row.WarningCode))
                {
                    warnings.Add(row.WarningCode);
                }

                continue;
            }

            string normalizedSiteId = ArmResourceIdNormalizer.Normalize(row.SiteResourceId);

            if (!string.IsNullOrWhiteSpace(row.KeyVaultHost)
                && hostToArmId.TryGetValue(row.KeyVaultHost.Trim().ToLowerInvariant(), out string? vaultArmId))
            {
                MapRelationship(
                    relationships,
                    relationshipKeys,
                    normalizedSiteId,
                    vaultArmId,
                    AzureInventoryRelationshipAssociationTypes.AppToKeyVaultRef,
                    ProvenanceKind.DerivedFact,
                    DerivedFactConfidence,
                    GraphEdgeInferenceSources.InventoryAppKeyVaultRef);
            }

            if (string.IsNullOrWhiteSpace(row.Host))
            {
                continue;
            }

            string normalizedHost = row.Host.Trim().ToLowerInvariant();

            if (!hostToArmId.TryGetValue(normalizedHost, out string? targetArmId))
            {
                warnings.Add($"{AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsHostUnresolved}:{normalizedHost}");

                continue;
            }

            MapRelationship(
                relationships,
                relationshipKeys,
                normalizedSiteId,
                targetArmId,
                AzureInventoryRelationshipAssociationTypes.HostnameInferredTarget,
                ProvenanceKind.DeterministicInference,
                DeterministicInferenceConfidence,
                GraphEdgeInferenceSources.InventoryHostnameInferredTarget);
        }
    }

    private static void MapRelationship(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromAzureResourceId,
        string toAzureResourceId,
        string associationType,
        ProvenanceKind provenanceKind,
        decimal confidence,
        string inferenceSource)
    {
        if (!AzureInventoryRelationshipAssociationTypes.TryGet(associationType, out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        string key = $"{fromAzureResourceId}|{associationType}|{toAzureResourceId}|{(int)provenanceKind}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = fromAzureResourceId,
            ToAzureResourceId = toAzureResourceId,
            RelationshipType = definition.DefaultGraphEdgeType,
            ProvenanceKind = provenanceKind,
            Confidence = confidence,
            InferenceSource = inferenceSource,
        });
    }
}
