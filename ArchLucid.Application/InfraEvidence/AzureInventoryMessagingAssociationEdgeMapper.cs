using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps messaging association rows to contains and capture edges (AX-DE-13).
/// </summary>
internal static class AzureInventoryMessagingAssociationEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;

    public static void MapAssociations(
        IReadOnlyList<AzureInventoryMessagingAssociationRow> associations,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(associations);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.EventHubCapture,
                out AzureInventoryRelationshipAssociationTypeDefinition? captureDefinition)
            || captureDefinition is null)
        {
            return;
        }

        foreach (AzureInventoryMessagingAssociationRow association in associations)
        {
            if (!association.CollectionStatus.Equals(
                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(association.WarningCode))
                {
                    warnings.Add(association.WarningCode);
                }

                continue;
            }

            AddRelationship(
                relationships,
                relationshipKeys,
                ArmResourceIdNormalizer.Normalize(association.ParentResourceId),
                ArmResourceIdNormalizer.Normalize(association.ChildResourceId),
                GraphEdgeTypes.Contains,
                ProvenanceKind.ObservedFact,
                ObservedFactConfidence,
                GraphEdgeInferenceSources.InventoryExplicitParentChild);

            if (!string.IsNullOrWhiteSpace(association.CaptureStorageAccountId))
            {
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    ArmResourceIdNormalizer.Normalize(association.ChildResourceId),
                    ArmResourceIdNormalizer.Normalize(association.CaptureStorageAccountId),
                    captureDefinition.DefaultGraphEdgeType,
                    captureDefinition.DefaultProvenanceKind,
                    ObservedFactConfidence,
                    captureDefinition.DefaultInferenceSource);
            }
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
