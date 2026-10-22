using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps PaaS child association rows to CONTAINS edges (AX-DE-14).
/// </summary>
internal static class AzureInventoryPaasChildAssociationEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;

    public static void MapAssociations(
        IReadOnlyList<AzureInventoryPaasChildAssociationRow> associations,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(associations);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        foreach (AzureInventoryPaasChildAssociationRow association in associations)
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
