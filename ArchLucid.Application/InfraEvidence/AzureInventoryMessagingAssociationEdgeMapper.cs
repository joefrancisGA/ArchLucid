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
        List<string> warnings,
        IReadOnlySet<string>? inventoriedArmIds = null)
    {
        ArgumentNullException.ThrowIfNull(associations);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        inventoriedArmIds ??= new HashSet<string>(StringComparer.OrdinalIgnoreCase);

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
                AzureInventoryEventHubVisibleEndpointResolver.ResolveCaptureEdge(
                    association,
                    inventoriedArmIds,
                    out string captureFromAzureResourceId,
                    out string captureInferenceSource);

                AddRelationship(
                    relationships,
                    relationshipKeys,
                    captureFromAzureResourceId,
                    ArmResourceIdNormalizer.Normalize(association.CaptureStorageAccountId),
                    captureDefinition.DefaultGraphEdgeType,
                    captureDefinition.DefaultProvenanceKind,
                    ObservedFactConfidence,
                    captureInferenceSource);
            }

            AddForwardRelationship(
                association,
                associations,
                relationships,
                relationshipKeys,
                association.ForwardToName,
                AzureInventoryRelationshipAssociationTypes.ServiceBusForwardTo);

            AddForwardRelationship(
                association,
                associations,
                relationships,
                relationshipKeys,
                association.ForwardDeadLetteredMessagesToName,
                AzureInventoryRelationshipAssociationTypes.ServiceBusForwardDeadLetterTo);
        }
    }

    private static void AddForwardRelationship(
        AzureInventoryMessagingAssociationRow association,
        IReadOnlyList<AzureInventoryMessagingAssociationRow> associations,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string? targetName,
        string associationType)
    {
        if (string.IsNullOrWhiteSpace(targetName)
            || !AzureInventoryRelationshipAssociationTypes.TryGet(
                associationType,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        string target = targetName.Trim();
        AzureInventoryMessagingAssociationRow? targetAssociation = associations.FirstOrDefault(candidate =>
            candidate.ParentResourceId.Equals(association.ParentResourceId, StringComparison.OrdinalIgnoreCase)
            && candidate.ChildName.Equals(target, StringComparison.OrdinalIgnoreCase));

        if (targetAssociation is null)
        {
            return;
        }

        AddRelationship(
            relationships,
            relationshipKeys,
            ArmResourceIdNormalizer.Normalize(association.ChildResourceId),
            ArmResourceIdNormalizer.Normalize(targetAssociation.ChildResourceId),
            definition.DefaultGraphEdgeType,
            definition.DefaultProvenanceKind,
            ObservedFactConfidence,
            definition.DefaultInferenceSource);
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
