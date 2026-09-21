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
        IEnumerable<AzureInventoryResourceRecord> resources,
        IReadOnlySet<string>? privateLinkOnlyNicArmIds = null,
        bool retainIdentityDiagramArmTypes = false)
    {
        return resources
            .Where(resource => !AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                resource.ResourceType,
                resource.AzureResourceId,
                privateLinkOnlyNicArmIds,
                retainIdentityDiagramArmTypes))
            .ToList();
    }

    public static List<AzureInventoryResourceRelationshipReadModel> FilterVisibleRelationships(
        IEnumerable<AzureInventoryResourceRelationshipReadModel> relationships,
        IReadOnlySet<string> visibleArmIds)
    {
        List<AzureInventoryResourceRelationshipReadModel> visible = [];

        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            if (!ShouldKeepRelationship(
                    relationship.FromAzureResourceId,
                    relationship.ToAzureResourceId,
                    relationship.RelationshipType,
                    relationship.InferenceSource,
                    visibleArmIds))
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
            if (!ShouldKeepRelationship(
                    relationship.FromAzureResourceId,
                    relationship.ToAzureResourceId,
                    relationship.RelationshipType,
                    relationship.InferenceSource,
                    visibleArmIds))
            {
                continue;
            }

            visible.Add(relationship);
        }

        return visible;
    }

    public static AzureInventorySnapshotDetailReadModel Apply(
        AzureInventorySnapshotDetailReadModel snapshot,
        bool retainIdentityDiagramArmTypes = false)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        HashSet<string> privateLinkOnlyNicArmIds = AzureInventoryPrivateLinkOnlyNicCatalog.BuildOmittedNicArmIdsFromSnapshot(
            snapshot.Resources,
            snapshot.Relationships,
            snapshot.Properties);
        List<AzureInventoryResourceRecord> visibleResources = FilterVisibleResources(
            snapshot.Resources,
            privateLinkOnlyNicArmIds,
            retainIdentityDiagramArmTypes);
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
            clauses.Add($"LOWER({resourceTypeColumn}) <> N'{EscapeSqlLiteral(lastSegment)}'");
        }

        string omitChecks = string.Join(" AND ", clauses);

        // SQL `<>` / NOT LIKE on NULL is UNKNOWN, so a bare AND of omit-checks would drop
        // rows with a missing ResourceType. C# ShouldOmitFromInventory treats blank type as visible.
        return WrapSqlNullableColumnAsVisible(resourceTypeColumn, omitChecks);
    }

    public static string BuildSqlAzureResourceIdVisiblePredicate(string azureResourceIdColumn)
    {
        List<string> clauses = [];

        foreach (string lastSegment in AzureInventoryNeverShowArmTypes.ResourceTypeLastSegmentSuffixes)
        {
            clauses.Add($"{azureResourceIdColumn} NOT LIKE N'%/{EscapeSqlLiteral(lastSegment)}/%'");
        }

        string omitChecks = string.Join(" AND ", clauses);

        return WrapSqlNullableColumnAsVisible(azureResourceIdColumn, omitChecks);
    }

    public static string BuildSqlNeverShowSqlDatabasePredicate(
        string resourceTypeColumn,
        string azureResourceIdColumn)
    {
        List<string> clauses = [];

        foreach (string databaseName in AzureInventoryNeverShowSqlDatabaseNames.NeverShowDatabaseNames)
        {
            string escapedName = EscapeSqlLiteral(databaseName);

            clauses.Add(
                $"NOT ({resourceTypeColumn} LIKE N'Microsoft.Sql/servers/databases%' AND LOWER({azureResourceIdColumn}) LIKE N'%/databases/{escapedName.ToLowerInvariant()}')");
            clauses.Add(
                $"NOT ({resourceTypeColumn} LIKE N'Microsoft.Sql/managedInstances/databases%' AND LOWER({azureResourceIdColumn}) LIKE N'%/databases/{escapedName.ToLowerInvariant()}')");
        }

        string omitChecks = string.Join(" AND ", clauses);

        return $"({resourceTypeColumn} IS NULL OR {resourceTypeColumn} = N'' OR ({omitChecks}))";
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

    private static bool ShouldKeepRelationship(
        string? fromAzureResourceId,
        string? toAzureResourceId,
        string? relationshipType,
        string? inferenceSource,
        IReadOnlySet<string> visibleArmIds)
    {
        bool fromVisible = IsVisibleInventoryArmResourceId(fromAzureResourceId, visibleArmIds);
        bool toVisible = IsVisibleInventoryArmResourceId(toAzureResourceId, visibleArmIds);

        if (fromVisible && toVisible)
        {
            return true;
        }

        // Remote VNets in another subscription are still real peering endpoints.
        if (AzureInventoryRelationshipAssociationTypes.IsVnetPeeringRelationship(relationshipType, inferenceSource)
            && (fromVisible || toVisible))
        {
            return true;
        }

        // Nested ARM children (subnets) are often omitted as ARG rows. Keep the hop when
        // the missing endpoint sits under a visible parent so diagram compile can lift
        // NIC / private-endpoint / App Service edges onto that parent.
        if (fromVisible
            && ArmResourceIdNormalizer.TryResolveVisibleAncestorArmId(
                toAzureResourceId,
                visibleArmIds,
                out _))
        {
            return true;
        }

        if (toVisible
            && ArmResourceIdNormalizer.TryResolveVisibleAncestorArmId(
                fromAzureResourceId,
                visibleArmIds,
                out _))
        {
            return true;
        }

        return false;
    }

    private static bool LooksLikeArmResourceId(string? value)
    {
        return !string.IsNullOrWhiteSpace(value)
               && value.Trim().StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Treats NULL or blank column values as visible. SQL three-valued logic would otherwise
    ///     exclude those rows from snapshot resource counts while C# omit checks keep them.
    /// </summary>
    private static string WrapSqlNullableColumnAsVisible(string column, string omitChecks)
    {
        return $"({column} IS NULL OR {column} = N'' OR ({omitChecks}))";
    }

    private static string EscapeSqlLiteral(string value)
    {
        return value.Replace("'", "''", StringComparison.Ordinal);
    }
}
