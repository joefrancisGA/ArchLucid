using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlCloudResourceIdentityDirectory(ISqlConnectionFactory connectionFactory)
    : ICloudResourceIdentityDirectory
{
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

    public async Task<CloudResourceIdentityRecord?> TryGetByCloudResourceIdAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (cloudResourceId == Guid.Empty)
            return null;

        const string sql = """
                           SELECT TOP (1)
                               CloudResourceId, TenantId, WorkspaceId, ProjectId, Provider,
                               ExternalResourceIdNormalized, ResourceType, SubscriptionOrAccountId,
                               ResourceGroupOrProject, Region, DisplayName,
                               FirstSeenSnapshotId, LastSeenSnapshotId, FirstSeenUtc, LastSeenUtc
                           FROM dbo.CloudResourceIdentities
                           WHERE TenantId = @TenantId
                               AND CloudResourceId = @CloudResourceId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await conn.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    CloudResourceId = cloudResourceId,
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

    public async Task<(IReadOnlyList<CloudResourceIdentityRecord> Items, int TotalCount)> ListForExplorerAsync(
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

        string countSql = $"""
                                SELECT COUNT(1)
                                FROM dbo.CloudResourceIdentities
                                WHERE TenantId = @TenantId
                                  AND WorkspaceId = @WorkspaceId
                                  AND ProjectId = @ProjectId
                                  AND (@NamePrefix IS NULL OR DisplayName LIKE @NamePrefix + '%' OR ExternalResourceIdNormalized LIKE '%' + @NamePrefix + '%')
                                  AND (@ResourceType IS NULL OR ResourceType = @ResourceType)
                                  AND (@ResourceGroup IS NULL OR ResourceGroupOrProject = @ResourceGroup)
                                  {workQueueFilter};
                                """;

        string listSql = $"""
                               SELECT
                                   CloudResourceId, TenantId, WorkspaceId, ProjectId, Provider,
                                   ExternalResourceIdNormalized, ResourceType, SubscriptionOrAccountId,
                                   ResourceGroupOrProject, Region, DisplayName,
                                   FirstSeenSnapshotId, LastSeenSnapshotId, FirstSeenUtc, LastSeenUtc
                               FROM dbo.CloudResourceIdentities
                               WHERE TenantId = @TenantId
                                 AND WorkspaceId = @WorkspaceId
                                 AND ProjectId = @ProjectId
                                 AND (@NamePrefix IS NULL OR DisplayName LIKE @NamePrefix + '%' OR ExternalResourceIdNormalized LIKE '%' + @NamePrefix + '%')
                                 AND (@ResourceType IS NULL OR ResourceType = @ResourceType)
                                 AND (@ResourceGroup IS NULL OR ResourceGroupOrProject = @ResourceGroup)
                                 {workQueueFilter}
                               ORDER BY LastSeenUtc DESC
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
            FindingStatusOpen = (int)OperationalSecurityFindingStatus.Open,
            FindingStatusRecurred = (int)OperationalSecurityFindingStatus.Recurred,
            FindingStatusAwaitingVerification = (int)OperationalSecurityFindingStatus.AwaitingVerification,
            RemediationStatusClosed = (int)RemediationInstanceStatus.Closed,
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

        IReadOnlyList<CloudResourceIdentityRecord> items = rows.Select(MapRow).ToList();

        return (items, totalCount);
    }

    private static string BuildWorkQueueFilter(CloudResourceExplorerWorkQueue workQueue) =>
        workQueue switch
        {
            CloudResourceExplorerWorkQueue.OpenFindings => """
                AND EXISTS (
                    SELECT 1
                    FROM dbo.OperationalSecurityFindings f
                    WHERE f.TenantId = dbo.CloudResourceIdentities.TenantId
                      AND f.CloudResourceId = dbo.CloudResourceIdentities.CloudResourceId
                      AND f.Status IN (@FindingStatusOpen, @FindingStatusRecurred, @FindingStatusAwaitingVerification)
                )
                """,
            CloudResourceExplorerWorkQueue.OpenRemediation => """
                AND EXISTS (
                    SELECT 1
                    FROM dbo.RemediationInstances r
                    WHERE r.TenantId = dbo.CloudResourceIdentities.TenantId
                      AND r.CloudResourceId = dbo.CloudResourceIdentities.CloudResourceId
                      AND r.Status <> @RemediationStatusClosed
                )
                """,
            CloudResourceExplorerWorkQueue.RecentDrift => """
                AND EXISTS (
                    SELECT 1
                    FROM dbo.AzureInventoryChanges c
                    WHERE c.TenantId = dbo.CloudResourceIdentities.TenantId
                      AND c.CloudResourceId = dbo.CloudResourceIdentities.CloudResourceId
                )
                """,
            _ => string.Empty,
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
    }
}
