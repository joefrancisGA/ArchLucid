using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Projects inventory snapshots to the resource and relationship rows that remain visible after
///     <see cref="AzureInventoryNeverShowArmTypes" /> filtering. Attested counts should match list and diagram surfaces.
/// </summary>
public static class AzureInventoryVisibleSnapshotProjection
{
    public static bool IsVisibleInventoryArmResourceId(string? armResourceId, IReadOnlySet<string> visibleArmIds)
    {
        if (!LooksLikeArmResourceId(armResourceId))
        {
            return true;
        }

        return visibleArmIds.Contains(ArmResourceIdNormalizer.Normalize(armResourceId!));
    }

    public static HashSet<string> BuildVisibleArmIdSet(IEnumerable<AzureInventoryResourceRecord> resources)
    {
        HashSet<string> visibleArmIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRecord resource in resources)
        {
            if (string.IsNullOrWhiteSpace(resource.AzureResourceId))
            {
                continue;
            }

            visibleArmIds.Add(ArmResourceIdNormalizer.Normalize(resource.AzureResourceId));
        }

        return visibleArmIds;
    }

    public static List<AzureInventoryResourceRecord> FilterVisibleResources(
        IEnumerable<AzureInventoryResourceRecord> resources)
    {
        return resources
            .Where(resource => !AzureInventoryNeverShowArmTypes.ShouldOmitFromInventory(resource.ResourceType))
            .ToList();
    }

    public static List<AzureInventoryResourceRelationshipReadModel> FilterVisibleRelationships(
        IEnumerable<AzureInventoryResourceRelationshipReadModel> relationships,
        IReadOnlySet<string> visibleArmIds)
    {
        List<AzureInventoryResourceRelationshipReadModel> visible = [];

        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            if (!IsVisibleInventoryArmResourceId(relationship.FromAzureResourceId, visibleArmIds)
                || !IsVisibleInventoryArmResourceId(relationship.ToAzureResourceId, visibleArmIds))
            {
                continue;
            }

            visible.Add(relationship);
        }

        return visible;
    }

    public static List<AzureInventoryResourceRelationshipWrite> FilterVisibleRelationships(
        IEnumerable<AzureInventoryResourceRelationshipWrite> relationships,
        IReadOnlySet<string> visibleArmIds)
    {
        List<AzureInventoryResourceRelationshipWrite> visible = [];

        foreach (AzureInventoryResourceRelationshipWrite relationship in relationships)
        {
            if (!IsVisibleInventoryArmResourceId(relationship.FromAzureResourceId, visibleArmIds)
                || !IsVisibleInventoryArmResourceId(relationship.ToAzureResourceId, visibleArmIds))
            {
                continue;
            }

            visible.Add(relationship);
        }

        return visible;
    }

    public static AzureInventorySnapshotDetailReadModel Apply(AzureInventorySnapshotDetailReadModel snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<AzureInventoryResourceRecord> visibleResources = FilterVisibleResources(snapshot.Resources);
        HashSet<string> visibleArmIds = BuildVisibleArmIdSet(visibleResources);
        List<AzureInventoryResourceRelationshipReadModel> visibleRelationships =
            FilterVisibleRelationships(snapshot.Relationships, visibleArmIds);
        HashSet<Guid> visibleResourceRowIds = visibleResources
            .Select(resource => resource.ResourceRowId)
            .ToHashSet();

        AzureInventorySnapshotRecord header = CloneHeader(
            snapshot.Header,
            visibleResources.Count,
            visibleRelationships.Count);

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = header,
            Resources = visibleResources,
            Properties = snapshot.Properties
                .Where(property => visibleResourceRowIds.Contains(property.ResourceRowId))
                .ToList(),
            Tags = snapshot.Tags
                .Where(tag => visibleResourceRowIds.Contains(tag.ResourceRowId))
                .ToList(),
            Relationships = visibleRelationships,
            RoleAssignments = snapshot.RoleAssignments,
            Diagnostics = snapshot.Diagnostics,
            DefenderSummaries = snapshot.DefenderSummaries,
        };
    }

    public static string BuildSqlResourceTypeVisiblePredicate(string resourceTypeColumn)
    {
        List<string> clauses = [];

        foreach (string catalogType in AzureInventoryNeverShowArmTypes.CatalogArmTypes)
        {
            clauses.Add($"{resourceTypeColumn} <> N'{EscapeSqlLiteral(catalogType)}'");
        }

        foreach (string lastSegment in AzureInventoryNeverShowArmTypes.ResourceTypeLastSegmentSuffixes)
        {
            clauses.Add($"{resourceTypeColumn} NOT LIKE N'%/{EscapeSqlLiteral(lastSegment)}'");
        }

        return string.Join(" AND ", clauses);
    }

    private static AzureInventorySnapshotRecord CloneHeader(
        AzureInventorySnapshotRecord header,
        int resourceCount,
        int relationshipCount)
    {
        return new AzureInventorySnapshotRecord
        {
            SnapshotId = header.SnapshotId,
            TenantId = header.TenantId,
            WorkspaceId = header.WorkspaceId,
            ProjectId = header.ProjectId,
            PackageId = header.PackageId,
            SubscriptionId = header.SubscriptionId,
            SubscriptionName = header.SubscriptionName,
            CapturedUtc = header.CapturedUtc,
            CaptureStatus = header.CaptureStatus,
            CaptureVersion = header.CaptureVersion,
            ResourceCount = resourceCount,
            RelationshipCount = relationshipCount,
            CaptureMethod = header.CaptureMethod,
            CollectorVersion = header.CollectorVersion,
            RequestedBy = header.RequestedBy,
            DurationMs = header.DurationMs,
            CompletenessScore = header.CompletenessScore,
            WarningCount = header.WarningCount,
            ErrorCount = header.ErrorCount,
            ContentHashSha256 = header.ContentHashSha256,
            CreatedUtc = header.CreatedUtc,
            UpdatedUtc = header.UpdatedUtc,
        };
    }

    private static bool LooksLikeArmResourceId(string? value)
    {
        return !string.IsNullOrWhiteSpace(value)
               && value.Trim().StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase);
    }

    private static string EscapeSqlLiteral(string value)
    {
        return value.Replace("'", "''", StringComparison.Ordinal);
    }
}
