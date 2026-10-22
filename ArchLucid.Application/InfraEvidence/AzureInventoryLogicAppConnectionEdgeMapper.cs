using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps Logic App connection rows to <c>logicAppConnection</c> relationships (AX-DE-12).
/// </summary>
internal static class AzureInventoryLogicAppConnectionEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;

    public static void MapConnections(
        IReadOnlyList<AzureInventoryLogicAppConnectionRow> connections,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(connections);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.LogicAppConnection,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        foreach (AzureInventoryLogicAppConnectionRow connection in connections)
        {
            if (!connection.CollectionStatus.Equals(
                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(connection.WarningCode))
                {
                    warnings.Add(connection.WarningCode);
                }

                continue;
            }

            if (string.IsNullOrWhiteSpace(connection.ConnectionResourceId))
            {
                continue;
            }

            AddRelationship(
                relationships,
                relationshipKeys,
                ArmResourceIdNormalizer.Normalize(connection.WorkflowResourceId),
                ArmResourceIdNormalizer.Normalize(connection.ConnectionResourceId),
                definition.DefaultGraphEdgeType,
                definition.DefaultProvenanceKind,
                DerivedFactConfidence,
                definition.DefaultInferenceSource);

            if (!string.IsNullOrWhiteSpace(connection.TargetResourceId))
            {
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    ArmResourceIdNormalizer.Normalize(connection.WorkflowResourceId),
                    ArmResourceIdNormalizer.Normalize(connection.TargetResourceId),
                    definition.DefaultGraphEdgeType,
                    definition.DefaultProvenanceKind,
                    DerivedFactConfidence,
                    definition.DefaultInferenceSource);
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
