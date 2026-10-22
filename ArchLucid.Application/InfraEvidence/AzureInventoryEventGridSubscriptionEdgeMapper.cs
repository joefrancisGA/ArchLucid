using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps Event Grid subscription rows to <c>eventGridToDestination</c> relationships (AX-DE-11).
/// </summary>
internal static class AzureInventoryEventGridSubscriptionEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;

    public static void MapSubscriptions(
        IReadOnlyList<AzureInventoryEventGridSubscriptionRow> subscriptions,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(subscriptions);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.EventGridToDestination,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        foreach (AzureInventoryEventGridSubscriptionRow subscription in subscriptions)
        {
            if (!subscription.CollectionStatus.Equals(
                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(subscription.WarningCode))
                {
                    warnings.Add(subscription.WarningCode);
                }

                continue;
            }

            if (!string.IsNullOrWhiteSpace(subscription.WarningCode))
            {
                warnings.Add(subscription.WarningCode);
            }

            if (string.IsNullOrWhiteSpace(subscription.DestinationResourceId))
            {
                continue;
            }

            AddRelationship(
                relationships,
                relationshipKeys,
                ArmResourceIdNormalizer.Normalize(subscription.SourceResourceId),
                ArmResourceIdNormalizer.Normalize(subscription.DestinationResourceId),
                definition.DefaultGraphEdgeType,
                definition.DefaultProvenanceKind,
                ObservedFactConfidence,
                definition.DefaultInferenceSource);
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
