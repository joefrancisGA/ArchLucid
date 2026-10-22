using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps SQL database Entra principal membership rows to authorization edges (SN-RT-08).
/// </summary>
internal static class AzureInventorySqlDatabasePrincipalEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;

    public static void MapPrincipals(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<AzureInventorySqlDatabasePrincipalRow> rows,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.SqlDatabasePrincipal,
                out AzureInventoryRelationshipAssociationTypeDefinition? sqlPrincipalDefinition)
            || sqlPrincipalDefinition is null)
        {
            return;
        }

        Dictionary<string, List<string>> nameToComputeArmIds =
            AzureInventoryComputeResourceNameIndex.BuildNameToArmIds(resources);
        HashSet<string> inventoriedArmIds = resources
            .Select(resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventorySqlDatabasePrincipalRow row in rows)
        {
            if (!row.CollectionStatus.Equals(
                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string databaseArmId = ArmResourceIdNormalizer.Normalize(row.DatabaseArmId);

            if (!inventoriedArmIds.Contains(databaseArmId))
            {
                continue;
            }

            if (!AzureInventoryComputeResourceNameIndex.TryResolveUniqueComputeArmId(
                    nameToComputeArmIds,
                    row.PrincipalName,
                    out string computeArmId))
            {
                warnings.Add($"sql-principal-name-ambiguous:{row.PrincipalName}");

                continue;
            }

            AddRelationship(
                relationships,
                relationshipKeys,
                computeArmId,
                databaseArmId,
                sqlPrincipalDefinition.DefaultGraphEdgeType,
                sqlPrincipalDefinition.DefaultProvenanceKind,
                DerivedFactConfidence,
                sqlPrincipalDefinition.DefaultInferenceSource);
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
        string key = $"{fromAzureResourceId}|{relationshipType}|{toAzureResourceId}|{(int)provenanceKind}|{inferenceSource}";

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
