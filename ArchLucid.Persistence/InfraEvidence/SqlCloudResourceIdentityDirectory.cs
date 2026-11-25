using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlCloudResourceIdentityDirectory(ISqlConnectionFactory connectionFactory)
    : ICloudResourceIdentityDirectory
{
    private static readonly string VisibleExplorerResourceTypePredicate =
        AzureInventoryVisibleSnapshotProjection.BuildSqlResourceTypeVisiblePredicate("latestObservation.ObservedResourceType");

    private static readonly string VisibleExplorerAzureResourceIdPredicate =
        AzureInventoryVisibleSnapshotProjection.BuildSqlAzureResourceIdVisiblePredicate("ExternalResourceIdNormalized");

    public async Task<CloudResourceIdentityRecord> UpsertOnSnapshotAsync(
        ScopeContext scope,
        CloudProvider provider,
        string externalResourceId,
        Guid snapshotId,
        string? resourceType,
        string? subscriptionOrAccountId,
        string? resourceGroupOrProject,
        string? region,
        string? displayName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(externalResourceId))
            throw new ArgumentException("External resource id is required.", nameof(externalResourceId));

        string normalized = ArmResourceIdNormalizer.Normalize(externalResourceId);
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        CloudResourceIdentityRecord? existing =
            await TryGetByExternalIdAsync(scope, provider, externalResourceId, cancellationToken);

        if (existing is not null)
        {
            const string updateSql = """
                                     UPDATE dbo.CloudResourceIdentities
                                     SET LastSeenSnapshotId = @SnapshotId,
                                         LastSeenUtc = @UtcNow,
                                         ResourceType = COALESCE(@ResourceType, ResourceType),
                                         SubscriptionOrAccountId = COALESCE(@SubscriptionOrAccountId, SubscriptionOrAccountId),
                                         ResourceGroupOrProject = COALESCE(@ResourceGroupOrProject, ResourceGroupOrProject),
                                         Region = COALESCE(@Region, Region),
                                         DisplayName = COALESCE(@DisplayName, DisplayName)
                                     WHERE TenantId = @TenantId
                                         AND Provider = @Provider
                                         AND ExternalResourceIdNormalized = @ExternalResourceIdNormalized;
                                     """;

            using System.Data.IDbConnection conn =
                await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

            await conn.ExecuteAsync(
                new CommandDefinition(
                    updateSql,
                    new
                    {
                        scope.TenantId,
                        Provider = (int)provider,
                        ExternalResourceIdNormalized = normalized,
                        SnapshotId = snapshotId,
                        UtcNow = utcNow,
                        ResourceType = resourceType,
                        SubscriptionOrAccountId = subscriptionOrAccountId,
                        ResourceGroupOrProject = resourceGroupOrProject,
                        Region = region,
                        DisplayName = displayName,
                    },
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));

            CloudResourceIdentityRecord? refreshed =
                await TryGetByExternalIdAsync(scope, provider, externalResourceId, cancellationToken);

            return refreshed ?? existing;
        }

        Guid cloudResourceId = Guid.NewGuid();

        const string insertSql = """
                                 INSERT INTO dbo.CloudResourceIdentities
                                 (
                                     CloudResourceId, TenantId, WorkspaceId, ProjectId, Provider,
                                     ExternalResourceIdNormalized, ResourceType, SubscriptionOrAccountId,
                                     ResourceGroupOrProject, Region, DisplayName,
                                     FirstSeenSnapshotId, LastSeenSnapshotId, FirstSeenUtc, LastSeenUtc
                                 )
                                 VALUES
                                 (
                                     @CloudResourceId, @TenantId, @WorkspaceId, @ProjectId, @Provider,
                                     @ExternalResourceIdNormalized, @ResourceType, @SubscriptionOrAccountId,
                                     @ResourceGroupOrProject, @Region, @DisplayName,
                                     @SnapshotId, @SnapshotId, @UtcNow, @UtcNow
                                 );
                                 """;

        using System.Data.IDbConnection insertConn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await insertConn.ExecuteAsync(
            new CommandDefinition(
                insertSql,
                new
                {
                    CloudResourceId = cloudResourceId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    Provider = (int)provider,
                    ExternalResourceIdNormalized = normalized,
                    ResourceType = resourceType,
                    SubscriptionOrAccountId = subscriptionOrAccountId,
                    ResourceGroupOrProject = resourceGroupOrProject,
                    Region = region,
                    DisplayName = displayName,
                    SnapshotId = snapshotId,
                    UtcNow = utcNow,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        return new CloudResourceIdentityRecord
        {
            CloudResourceId = cloudResourceId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = provider,
            ExternalResourceIdNormalized = normalized,
            ResourceType = resourceType,
            SubscriptionOrAccountId = subscriptionOrAccountId,
            ResourceGroupOrProject = resourceGroupOrProject,
            Region = region,
            DisplayName = displayName,
            FirstSeenSnapshotId = snapshotId,
            LastSeenSnapshotId = snapshotId,
            FirstSeenUtc = utcNow,
            LastSeenUtc = utcNow,
        };
    }

    public async Task<CloudResourceIdentityRecord?> TryGetByExternalIdAsync(
        ScopeContext scope,
        CloudProvider provider,
        string externalResourceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string normalized = ArmResourceIdNormalizer.Normalize(externalResourceId);

        if (string.IsNullOrEmpty(normalized))
            return null;

        const string sql = """
                           SELECT TOP (1)
                               CloudResourceId, TenantId, WorkspaceId, ProjectId, Provider,
                               ExternalResourceIdNormalized, ResourceType, SubscriptionOrAccountId,
                               ResourceGroupOrProject, Region, DisplayName,
                               FirstSeenSnapshotId, LastSeenSnapshotId, FirstSeenUtc, LastSeenUtc
                           FROM dbo.CloudResourceIdentities
                           WHERE TenantId = @TenantId
                               AND Provider = @Provider
                               AND ExternalResourceIdNormalized = @ExternalResourceIdNormalized;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await conn.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    Provider = (int)provider,
                    ExternalResourceIdNormalized = normalized,
                },
                cancellationToken: cancellationToken));

        if (row is null)
            return null;

        return new CloudResourceIdentityRecord
        {
            CloudResourceId = row.CloudResourceId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            Provider = (CloudProvider)row.Provider,
            ExternalResourceIdNormalized = row.ExternalResourceIdNormalized,
            ResourceType = row.ResourceType,
            SubscriptionOrAccountId = row.SubscriptionOrAccountId,
            ResourceGroupOrProject = row.ResourceGroupOrProject,
            Region = row.Region,
            DisplayName = row.DisplayName,
            FirstSeenSnapshotId = row.FirstSeenSnapshotId,
            LastSeenSnapshotId = row.LastSeenSnapshotId,
            FirstSeenUtc = row.FirstSeenUtc,
            LastSeenUtc = row.LastSeenUtc,
        };
    }

    public Task<CloudResourceIdentityRecord?> TryGetByCloudResourceIdAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default) =>
        TryGetIdentityAsync(scope, cloudResourceId, requireProject: false, cancellationToken);

    public Task<CloudResourceIdentityRecord?> TryGetByCloudResourceIdInScopeAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default) =>
        TryGetIdentityAsync(scope, cloudResourceId, requireProject: true, cancellationToken);

    private async Task<CloudResourceIdentityRecord?> TryGetIdentityAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        bool requireProject,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (cloudResourceId == Guid.Empty || (requireProject &&
            (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty)))
            return null;

        string seenColumns = requireProject
            ? "latestObservation.SnapshotId AS LastSeenSnapshotId, FirstSeenUtc, "
                + "COALESCE(latestObservation.ObservedUtc, FirstSeenUtc) AS LastSeenUtc"
            : "LastSeenSnapshotId, FirstSeenUtc, LastSeenUtc";
        string metadataColumns = requireProject
            ? ScopedMetadataColumns
            : "ResourceType, SubscriptionOrAccountId, ResourceGroupOrProject, Region, DisplayName";
        string observations = requireProject ? ScopedLatestObservationSql : string.Empty;
        string sql = $"""
                           SELECT TOP (1)
                               CloudResourceId, TenantId, WorkspaceId, ProjectId, Provider,
                               ExternalResourceIdNormalized, {metadataColumns},
                               FirstSeenSnapshotId, {seenColumns}
                           FROM dbo.CloudResourceIdentities
                           {observations}
                           WHERE TenantId = @TenantId
                               AND CloudResourceId = @CloudResourceId
                               AND (@RequireProject = 0 OR (WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId));
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await conn.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                    RequireProject = requireProject,
                    CloudResourceId = cloudResourceId,
                    SucceededStatus = (int)AzureInventoryCaptureStatus.Succeeded,
                    PartialStatus = (int)AzureInventoryCaptureStatus.Partial,
                },
                cancellationToken: cancellationToken));

        if (row is null)
            return null;

        return new CloudResourceIdentityRecord
        {
            CloudResourceId = row.CloudResourceId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            Provider = (CloudProvider)row.Provider,
            ExternalResourceIdNormalized = row.ExternalResourceIdNormalized,
            ResourceType = row.ResourceType,
            SubscriptionOrAccountId = row.SubscriptionOrAccountId,
            ResourceGroupOrProject = row.ResourceGroupOrProject,
            Region = row.Region,
            DisplayName = row.DisplayName,
            FirstSeenSnapshotId = row.FirstSeenSnapshotId,
            LastSeenSnapshotId = row.LastSeenSnapshotId,
            FirstSeenUtc = row.FirstSeenUtc,
            LastSeenUtc = row.LastSeenUtc,
        };
    }

    public async Task UpdateResourceCloudResourceIdAsync(
        ScopeContext scope,
        Guid resourceRowId,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           UPDATE dbo.AzureInventoryResources
                           SET CloudResourceId = @CloudResourceId
                           WHERE TenantId = @TenantId
                               AND ResourceRowId = @ResourceRowId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    ResourceRowId = resourceRowId,
                    CloudResourceId = cloudResourceId,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));
    }

    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Runtime explorer filter SQL; CloudResourceIdentities scope via ScopeContext parameters.")]
    public async Task<(IReadOnlyList<CloudResourceExplorerListItem> Items, int TotalCount)> ListForExplorerAsync(
        ScopeContext scope,
        string? namePrefix,
        string? resourceType,
        string? resourceGroup,
        CloudResourceExplorerWorkQueue workQueue,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);
        string? trimmedPrefix = string.IsNullOrWhiteSpace(namePrefix) ? null : namePrefix.Trim();
        string? trimmedType = string.IsNullOrWhiteSpace(resourceType) ? null : resourceType.Trim();
        string? trimmedGroup = string.IsNullOrWhiteSpace(resourceGroup) ? null : resourceGroup.Trim();
        string workQueueFilter = BuildWorkQueueFilter(workQueue);

        // Use the same project observation and predicates for the total and the page.
        // The displayed SQL name is a segment of the canonical ID, so ID search also matches that name.
        string scopedRowsSql = $"""
                               FROM dbo.CloudResourceIdentities
                               {ScopedLatestObservationSql}
                               WHERE TenantId = @TenantId
                                 AND WorkspaceId = @WorkspaceId
                                 AND ProjectId = @ProjectId
                                 AND (@NamePrefix IS NULL OR ExternalResourceIdNormalized LIKE '%' + @NamePrefix + '%')
                                 AND (@ResourceType IS NULL OR latestObservation.ObservedResourceType = @ResourceType)
                                 AND (@ResourceGroup IS NULL OR latestObservation.ObservedResourceGroup = @ResourceGroup)
                                 AND {VisibleExplorerResourceTypePredicate}
                                 AND {VisibleExplorerAzureResourceIdPredicate}
                                 {workQueueFilter}
                                 {PersistenceTenantScope.AndTripleWhere(scope)}
                               """;

        string countSql = $"SELECT COUNT(1) {scopedRowsSql};";

        string listSql = $"""
                               SELECT
                                   CloudResourceId, TenantId, WorkspaceId, ProjectId, Provider,
                                   ExternalResourceIdNormalized, {ScopedMetadataColumns},
                                   FirstSeenSnapshotId, latestObservation.SnapshotId AS LastSeenSnapshotId, FirstSeenUtc,
                                   COALESCE(latestObservation.ObservedUtc, FirstSeenUtc) AS LastSeenUtc,
                                   {OpenOperationalFindingsCountSql} AS OpenOperationalFindingsCount,
                                   {OpenRemediationInstancesCountSql} AS OpenRemediationInstancesCount,
                                   {InventoryDriftChangeCountSql} AS InventoryDriftChangeCount
                               {scopedRowsSql}
                               ORDER BY COALESCE(latestObservation.ObservedUtc, FirstSeenUtc) DESC, CloudResourceId ASC
                               OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY;
                               """;

        object parameters = new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            NamePrefix = trimmedPrefix,
            ResourceType = trimmedType,
            ResourceGroup = trimmedGroup,
            Skip = skip,
            PageSize = safePageSize,
            ScopeTenantId = scope.TenantId,
            ScopeWorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            FindingStatusOpen = (int)OperationalSecurityFindingStatus.Open,
            FindingStatusRecurred = (int)OperationalSecurityFindingStatus.Recurred,
            FindingStatusAwaitingVerification = (int)OperationalSecurityFindingStatus.AwaitingVerification,
            RemediationStatusClosed = (int)RemediationInstanceStatus.Closed,
            SucceededStatus = (int)AzureInventoryCaptureStatus.Succeeded,
            PartialStatus = (int)AzureInventoryCaptureStatus.Partial,
        };

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int totalCount = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken));

        IEnumerable<Row> rows = await conn.QueryAsync<Row>(
            new CommandDefinition(
                listSql,
                parameters,
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        IReadOnlyList<CloudResourceExplorerListItem> items = rows.Select(MapExplorerRow).ToList();

        return (items, totalCount);
    }

    // Snapshot resource rows do not persist the imported display label. The
    // immutable, normalized ARM ID supplies a stable label without reading a foreign observation.
    private const string ScopedMetadataColumns = """
        latestObservation.ObservedResourceType AS ResourceType,
        latestObservation.ObservedSubscriptionId AS SubscriptionOrAccountId,
        latestObservation.ObservedResourceGroup AS ResourceGroupOrProject,
        latestObservation.ObservedRegion AS Region,
        NULLIF(RIGHT(ExternalResourceIdNormalized,
            CHARINDEX(N'/', REVERSE(ExternalResourceIdNormalized) + N'/') - 1), N'') AS DisplayName
        """;

    // Tenant-wide identity is independent of the project-owned observation used for display.
    private const string ScopedLatestObservationSql = """
        LEFT JOIN (
            SELECT r.CloudResourceId AS ObservedResourceId, s.SnapshotId,
                   COALESCE(s.CapturedUtc, s.CreatedUtc) AS ObservedUtc,
                   r.ResourceType AS ObservedResourceType, r.Region AS ObservedRegion,
                   r.ResourceGroup AS ObservedResourceGroup,
                   COALESCE(r.SubscriptionId, s.SubscriptionId) AS ObservedSubscriptionId,
                   ROW_NUMBER() OVER (
                       PARTITION BY r.CloudResourceId
                       ORDER BY COALESCE(s.CapturedUtc, s.CreatedUtc) DESC, s.CreatedUtc DESC, s.SnapshotId DESC,
                                r.AzureResourceId, r.ResourceRowId
                   ) AS ObservationRank
            FROM dbo.AzureInventorySnapshots s
            INNER JOIN dbo.AzureInventoryResources r ON r.TenantId = s.TenantId AND r.SnapshotId = s.SnapshotId
            WHERE s.TenantId = @TenantId AND s.WorkspaceId = @WorkspaceId AND s.ProjectId = @ProjectId
              AND s.CaptureStatus IN (@SucceededStatus, @PartialStatus)
              AND r.CloudResourceId IS NOT NULL
        ) latestObservation ON latestObservation.ObservedResourceId = dbo.CloudResourceIdentities.CloudResourceId
                            AND latestObservation.ObservationRank = 1
        """;

    // Resource identity is tenant-deduplicated. Work items must also belong to
    // the identity's workspace and project; a shared resource ID is not scope authority.
    // Reuse the same row predicate for counts and queue membership.
    private const string OpenOperationalFindingsRowsSql = """
        FROM dbo.OperationalSecurityFindings f
        WHERE f.TenantId = dbo.CloudResourceIdentities.TenantId
          AND f.WorkspaceId = dbo.CloudResourceIdentities.WorkspaceId
          AND f.ProjectId = dbo.CloudResourceIdentities.ProjectId
          AND f.CloudResourceId = dbo.CloudResourceIdentities.CloudResourceId
          AND f.Status IN (@FindingStatusOpen, @FindingStatusRecurred, @FindingStatusAwaitingVerification)
        """;

    private const string OpenRemediationInstancesRowsSql = """
        FROM dbo.RemediationInstances r
        WHERE r.TenantId = dbo.CloudResourceIdentities.TenantId
          AND r.WorkspaceId = dbo.CloudResourceIdentities.WorkspaceId
          AND r.ProjectId = dbo.CloudResourceIdentities.ProjectId
          AND r.CloudResourceId = dbo.CloudResourceIdentities.CloudResourceId
          AND r.Status <> @RemediationStatusClosed
        """;

    private const string InventoryDriftChangeRowsSql = """
        FROM dbo.AzureInventoryChanges c
        INNER JOIN dbo.AzureInventoryDiffs d ON d.DiffId = c.DiffId AND d.TenantId = c.TenantId
        WHERE c.TenantId = dbo.CloudResourceIdentities.TenantId
          AND d.WorkspaceId = dbo.CloudResourceIdentities.WorkspaceId
          AND d.ProjectId = dbo.CloudResourceIdentities.ProjectId
          AND c.CloudResourceId = dbo.CloudResourceIdentities.CloudResourceId
        """;

    private const string OpenOperationalFindingsCountSql = "(SELECT COUNT(1) " + OpenOperationalFindingsRowsSql + ")";
    private const string OpenRemediationInstancesCountSql = "(SELECT COUNT(1) " + OpenRemediationInstancesRowsSql + ")";
    private const string InventoryDriftChangeCountSql = "(SELECT COUNT(1) " + InventoryDriftChangeRowsSql + ")";

    private static string BuildWorkQueueFilter(CloudResourceExplorerWorkQueue workQueue) =>
        workQueue switch
        {
            CloudResourceExplorerWorkQueue.OpenFindings => $"AND EXISTS (SELECT 1 {OpenOperationalFindingsRowsSql})",
            CloudResourceExplorerWorkQueue.OpenRemediation => $"AND EXISTS (SELECT 1 {OpenRemediationInstancesRowsSql})",
            CloudResourceExplorerWorkQueue.RecentDrift => $"AND EXISTS (SELECT 1 {InventoryDriftChangeRowsSql})",
            _ => string.Empty,
        };

    private static CloudResourceExplorerListItem MapExplorerRow(Row row) =>
        new()
        {
            Identity = MapRow(row),
            WorkCounts = new CloudResourceExplorerWorkCounts
            {
                OpenOperationalFindingsCount = row.OpenOperationalFindingsCount,
                OpenRemediationInstancesCount = row.OpenRemediationInstancesCount,
                InventoryDriftChangeCount = row.InventoryDriftChangeCount,
            },
        };

    private static CloudResourceIdentityRecord MapRow(Row row) =>
        new()
        {
            CloudResourceId = row.CloudResourceId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            Provider = (CloudProvider)row.Provider,
            ExternalResourceIdNormalized = row.ExternalResourceIdNormalized,
            ResourceType = row.ResourceType,
            SubscriptionOrAccountId = row.SubscriptionOrAccountId,
            ResourceGroupOrProject = row.ResourceGroupOrProject,
            Region = row.Region,
            DisplayName = row.DisplayName,
            FirstSeenSnapshotId = row.FirstSeenSnapshotId,
            LastSeenSnapshotId = row.LastSeenSnapshotId,
            FirstSeenUtc = row.FirstSeenUtc,
            LastSeenUtc = row.LastSeenUtc,
        };

    private sealed class Row
    {
        public Guid CloudResourceId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid ProjectId
        {
            get;
            init;
        }

        public int Provider
        {
            get;
            init;
        }

        public string ExternalResourceIdNormalized
        {
            get;
            init;
        } = string.Empty;

        public string? ResourceType
        {
            get;
            init;
        }

        public string? SubscriptionOrAccountId
        {
            get;
            init;
        }

        public string? ResourceGroupOrProject
        {
            get;
            init;
        }

        public string? Region
        {
            get;
            init;
        }

        public string? DisplayName
        {
            get;
            init;
        }

        public Guid? FirstSeenSnapshotId
        {
            get;
            init;
        }

        public Guid? LastSeenSnapshotId
        {
            get;
            init;
        }

        public DateTime FirstSeenUtc
        {
            get;
            init;
        }

        public DateTime LastSeenUtc
        {
            get;
            init;
        }

        public int OpenOperationalFindingsCount
        {
            get;
            init;
        }

        public int OpenRemediationInstancesCount
        {
            get;
            init;
        }

        public int InventoryDriftChangeCount
        {
            get;
            init;
        }
    }
}
