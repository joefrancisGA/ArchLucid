using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAzureInventoryBaselineRepository(ISqlConnectionFactory connectionFactory)
    : IAzureInventoryBaselineRepository
{
    public async Task InsertAsync(AzureInventoryBaselineRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.AzureInventoryBaselines
                           (
                               BaselineId, TenantId, WorkspaceId, ProjectId, SnapshotId, BaselineKind,
                               SubscriptionId, DesignatedBy, DesignatedUtc, Notes
                           )
                           VALUES
                           (
                               @BaselineId, @TenantId, @WorkspaceId, @ProjectId, @SnapshotId, @BaselineKind,
                               @SubscriptionId, @DesignatedBy, @DesignatedUtc, @Notes
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.BaselineId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    record.SnapshotId,
                    BaselineKind = (int)record.BaselineKind,
                    record.SubscriptionId,
                    record.DesignatedBy,
                    record.DesignatedUtc,
                    record.Notes,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AzureInventoryBaselineRecord>> ListByScopeAsync(
        ScopeContext scope,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string sql = """
                     SELECT BaselineId, TenantId, WorkspaceId, ProjectId, SnapshotId, BaselineKind,
                            SubscriptionId, DesignatedBy, DesignatedUtc, Notes
                     FROM dbo.AzureInventoryBaselines
                     WHERE TenantId = @TenantId
                       AND WorkspaceId = @WorkspaceId
                       AND ProjectId = @ProjectId
                     """;

        if (!string.IsNullOrWhiteSpace(subscriptionId))
            sql += " AND SubscriptionId = @SubscriptionId";

        sql += " ORDER BY DesignatedUtc DESC;";

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<BaselineRow> rows = await conn.QueryAsync<BaselineRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SubscriptionId = subscriptionId,
                },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<AzureInventoryBaselineRecord?> TryGetLatestByKindAsync(
        ScopeContext scope,
        AzureInventoryBaselineKind baselineKind,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string sql = """
                     SELECT TOP (1)
                         BaselineId, TenantId, WorkspaceId, ProjectId, SnapshotId, BaselineKind,
                         SubscriptionId, DesignatedBy, DesignatedUtc, Notes
                     FROM dbo.AzureInventoryBaselines
                     WHERE TenantId = @TenantId
                       AND WorkspaceId = @WorkspaceId
                       AND ProjectId = @ProjectId
                       AND BaselineKind = @BaselineKind
                     """;

        if (!string.IsNullOrWhiteSpace(subscriptionId))
            sql += " AND SubscriptionId = @SubscriptionId";

        sql += " ORDER BY DesignatedUtc DESC;";

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        BaselineRow? row = await conn.QuerySingleOrDefaultAsync<BaselineRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    BaselineKind = (int)baselineKind,
                    SubscriptionId = subscriptionId,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    private static AzureInventoryBaselineRecord Map(BaselineRow row) =>
        new()
        {
            BaselineId = row.BaselineId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            SnapshotId = row.SnapshotId,
            BaselineKind = (AzureInventoryBaselineKind)row.BaselineKind,
            SubscriptionId = row.SubscriptionId,
            DesignatedBy = row.DesignatedBy,
            DesignatedUtc = row.DesignatedUtc,
            Notes = row.Notes,
        };

    private sealed class BaselineRow
    {
        public Guid BaselineId
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

        public Guid SnapshotId
        {
            get;
            init;
        }

        public int BaselineKind
        {
            get;
            init;
        }

        public string? SubscriptionId
        {
            get;
            init;
        }

        public string DesignatedBy
        {
            get;
            init;
        } = string.Empty;

        public DateTime DesignatedUtc
        {
            get;
            init;
        }

        public string? Notes
        {
            get;
            init;
        }
    }
}
