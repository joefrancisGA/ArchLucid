using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps optional <c>effective-network-controls.json</c> rows to reachability edges (IE-RF-10).
/// </summary>
internal static class AzureInventoryEffectiveNetworkControlEdgeMapper
{
    private const decimal DeterministicInferenceConfidence = 0.8m;

    public static void MapControls(
        IReadOnlyList<AzureInventoryEffectiveNetworkControlRow> effectiveNetworkControls,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        ArgumentNullException.ThrowIfNull(effectiveNetworkControls);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);

        foreach (AzureInventoryEffectiveNetworkControlRow control in effectiveNetworkControls)
        {
            if (!control.CollectionStatus.Equals(
                    AzureInventoryEffectiveNetworkControlCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(control.NicResourceId)
                || string.IsNullOrWhiteSpace(control.EffectiveResourceId))
            {
                continue;
            }

            string normalizedNic = ArmResourceIdNormalizer.Normalize(control.NicResourceId);
            string normalizedTarget = ArmResourceIdNormalizer.Normalize(control.EffectiveResourceId);

            if (control.Kind.Equals(AzureInventoryEffectiveNetworkControlKind.EffectiveNsg, StringComparison.OrdinalIgnoreCase))
            {
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    normalizedNic,
                    normalizedTarget,
                    GraphEdgeTypes.AppliesTo,
                    GraphEdgeInferenceSources.InventoryEffectiveNsg);
            }
            else if (control.Kind.Equals(
                         AzureInventoryEffectiveNetworkControlKind.EffectiveRoutes,
                         StringComparison.OrdinalIgnoreCase))
            {
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    normalizedNic,
                    normalizedTarget,
                    GraphEdgeTypes.RoutesTo,
                    GraphEdgeInferenceSources.InventoryEffectiveRoutes);
            }
        }
    }

    private static void AddRelationship(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromArmId,
        string toArmId,
        string relationshipType,
        string inferenceSource)
    {
        string key = $"{fromArmId}|{toArmId}|{relationshipType}|{inferenceSource}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = fromArmId,
            ToAzureResourceId = toArmId,
            RelationshipType = relationshipType,
            ProvenanceKind = ProvenanceKind.DeterministicInference,
            Confidence = DeterministicInferenceConfidence,
            InferenceSource = inferenceSource,
        });
    }
}
