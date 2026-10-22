using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Maps Recovery Services protected-item rows to <c>PROTECTS</c> relationships (RSV-03).</summary>
internal static class AzureInventoryRecoveryServicesEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;

    public static void MapProtectedItems(
        IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow> protectedItems,
        IReadOnlySet<string> visibleArmIds,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(protectedItems);
        ArgumentNullException.ThrowIfNull(visibleArmIds);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        foreach (AzureInventoryRecoveryServicesProtectedItemRow item in protectedItems)
        {
            if (!item.CollectionStatus.Equals(
                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(item.WarningCode))
                {
                    warnings.Add(item.WarningCode);
                }

                continue;
            }

            if (string.IsNullOrWhiteSpace(item.SourceResourceId))
            {
                continue;
            }

            string normalizedSourceId = ArmResourceIdNormalizer.Normalize(item.SourceResourceId);

            if (!visibleArmIds.Contains(normalizedSourceId))
            {
                continue;
            }

            string associationType;
            string inferenceSource;

            if (string.Equals(item.ItemKind, AzureInventoryRecoveryServices.ReplicationItemKind, StringComparison.OrdinalIgnoreCase))
            {
                associationType = AzureInventoryRelationshipAssociationTypes.RecoveryServicesReplicates;
                inferenceSource = GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates;
            }
            else
            {
                associationType = AzureInventoryRelationshipAssociationTypes.RecoveryServicesProtects;
                inferenceSource = GraphEdgeInferenceSources.InventoryRecoveryServicesProtects;
            }

            if (!AzureInventoryRelationshipAssociationTypes.TryGet(associationType, out AzureInventoryRelationshipAssociationTypeDefinition? definition)
                || definition is null)
            {
                continue;
            }

            AddRelationship(
                relationships,
                relationshipKeys,
                ArmResourceIdNormalizer.Normalize(item.VaultResourceId),
                normalizedSourceId,
                definition.DefaultGraphEdgeType,
                definition.DefaultProvenanceKind,
                ObservedFactConfidence,
                inferenceSource);
        }
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
