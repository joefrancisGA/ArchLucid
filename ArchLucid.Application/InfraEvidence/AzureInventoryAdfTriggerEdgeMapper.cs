using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps ADF trigger rows to <c>adfTriggerSource</c> relationships (AX-DE-06).
/// </summary>
internal static class AzureInventoryAdfTriggerEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;
    private const decimal DeterministicInferenceConfidence = 0.8m;

    public static void MapTriggers(
        IReadOnlyList<AzureInventoryAdfTriggerRow> triggers,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(triggers);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.AdfTriggerSource,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        foreach (AzureInventoryAdfTriggerRow trigger in triggers)
        {
            if (!trigger.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded, StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(trigger.WarningCode))
                {
                    warnings.Add(trigger.WarningCode);
                }

                continue;
            }

            string? sourceArmId = ResolveSourceArmId(trigger);

            if (string.IsNullOrWhiteSpace(sourceArmId))
            {
                continue;
            }

            ProvenanceKind provenanceKind = string.IsNullOrWhiteSpace(trigger.SourceResourceId)
                ? ProvenanceKind.DeterministicInference
                : ProvenanceKind.ObservedFact;

            decimal confidence = provenanceKind == ProvenanceKind.ObservedFact
                ? ObservedFactConfidence
                : DeterministicInferenceConfidence;

            AddRelationship(
                relationships,
                relationshipKeys,
                sourceArmId,
                ArmResourceIdNormalizer.Normalize(trigger.FactoryResourceId),
                definition.DefaultGraphEdgeType,
                provenanceKind,
                confidence,
                definition.DefaultInferenceSource);
        }
    }

    private static string? ResolveSourceArmId(AzureInventoryAdfTriggerRow trigger)
    {
        if (!string.IsNullOrWhiteSpace(trigger.SourceResourceId))
        {
            return ArmResourceIdNormalizer.Normalize(trigger.SourceResourceId);
        }

        if (string.IsNullOrWhiteSpace(trigger.SourceHost))
        {
            return null;
        }

        return null;
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
