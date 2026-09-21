using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.OperatorInferredConnections;

/// <summary>
///     Merges operator-confirmed inferred connections into snapshot relationships for Data Flow (SN-RT-10).
/// </summary>
public static class OperatorInferredConnectionSnapshotMerger
{
    public static AzureInventorySnapshotDetailReadModel Merge(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<OperatorInferredConnectionRecord> confirmedConnections)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(confirmedConnections);

        if (confirmedConnections.Count == 0)
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

        foreach (OperatorInferredConnectionRecord connection in confirmedConnections)
        {
            if (connection.Status != OperatorInferredConnectionStatus.Confirmed)
            {
                continue;
            }

            string? fromArmId = ResolveArmId(connection.FromArmId, connection.FromCloudResourceId, armIdByCloudResourceId);
            string? toArmId = ResolveArmId(connection.ToArmId, connection.ToCloudResourceId, armIdByCloudResourceId);

            if (string.IsNullOrWhiteSpace(fromArmId) || string.IsNullOrWhiteSpace(toArmId))
            {
                continue;
            }

            string relationshipType = GraphEdgeTypes.ConnectsTo;
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
                InferenceSource = GraphEdgeInferenceSources.OperatorConfirmedConnection,
                DeclaredConnectionId = connection.ConnectionId,
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

    private static string? ResolveArmId(
        string? armId,
        Guid? cloudResourceId,
        IReadOnlyDictionary<Guid, string> armIdByCloudResourceId)
    {
        if (!string.IsNullOrWhiteSpace(armId))
        {
            return armId.Trim();
        }

        if (cloudResourceId is Guid resolvedCloudResourceId
            && armIdByCloudResourceId.TryGetValue(resolvedCloudResourceId, out string? mappedArmId))
        {
            return mappedArmId;
        }

        return null;
    }

    private static string BuildRelationshipKey(string fromArmId, string toArmId, string relationshipType) =>
        $"{fromArmId}|{relationshipType}|{toArmId}";
}
