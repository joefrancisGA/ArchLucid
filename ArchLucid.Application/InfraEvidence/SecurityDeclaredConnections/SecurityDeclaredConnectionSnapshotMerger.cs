using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecurityDeclaredConnections;

/// <summary>
///     Merges active human-declared connections into snapshot relationships for path engines and diagrams.
/// </summary>
public static class SecurityDeclaredConnectionSnapshotMerger
{
    public static AzureInventorySnapshotDetailReadModel Merge(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<SecurityDeclaredConnectionRecord> activeConnections,
        DateTime asOfUtc)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(activeConnections);

        if (activeConnections.Count == 0)
        {
            return snapshot;
        }

        Dictionary<Guid, string> armIdByCloudResourceId = new();

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            if (resource.CloudResourceId is not Guid cloudResourceId)
            {
                continue;
            }

            armIdByCloudResourceId[cloudResourceId] = resource.AzureResourceId;
        }

        List<AzureInventoryResourceRelationshipReadModel> mergedRelationships =
            [.. snapshot.Relationships];
        HashSet<string> existingKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {
            existingKeys.Add(BuildRelationshipKey(
                relationship.FromAzureResourceId,
                relationship.ToAzureResourceId,
                relationship.RelationshipType));
        }

        foreach (SecurityDeclaredConnectionRecord connection in activeConnections)
        {
            if (connection.Status != SecurityDeclaredConnectionStatus.Active
                || connection.ExpirationUtc <= asOfUtc)
            {
                continue;
            }

            if (!armIdByCloudResourceId.TryGetValue(connection.FromCloudResourceId, out string? fromArmId)
                || !armIdByCloudResourceId.TryGetValue(connection.ToCloudResourceId, out string? toArmId))
            {
                continue;
            }

            string relationshipType = MapRelationshipType(connection.RelationshipType);
            string key = BuildRelationshipKey(fromArmId, toArmId, relationshipType);

            if (!existingKeys.Add(key))
            {
                continue;
            }

            mergedRelationships.Add(new AzureInventoryResourceRelationshipReadModel
            {
                FromAzureResourceId = fromArmId,
                ToAzureResourceId = toArmId,
                RelationshipType = relationshipType,
                ProvenanceKind = ProvenanceKind.HumanAssertion,
                InferenceSource = GraphEdgeInferenceSources.HumanDeclaredConnection,
            });
        }

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = snapshot.Header,
            Resources = snapshot.Resources,
            Properties = snapshot.Properties,
            Tags = snapshot.Tags,
            Relationships = mergedRelationships,
            RoleAssignments = snapshot.RoleAssignments,
            Diagnostics = snapshot.Diagnostics,
            DefenderSummaries = snapshot.DefenderSummaries,
        };
    }

    private static string MapRelationshipType(SecurityDeclaredConnectionRelationshipType relationshipType) =>
        relationshipType switch
        {
            SecurityDeclaredConnectionRelationshipType.ConnectsTo => GraphEdgeTypes.ConnectsTo,
            SecurityDeclaredConnectionRelationshipType.DependsOn => GraphEdgeTypes.DependsOn,
            _ => throw new ArgumentOutOfRangeException(nameof(relationshipType), relationshipType, null),
        };

    private static string BuildRelationshipKey(string fromArmId, string toArmId, string relationshipType) =>
        $"{fromArmId}|{relationshipType}|{toArmId}";
}
