using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);

        const string countSql = """
                                SELECT COUNT(1)
                                FROM dbo.AzureInventorySnapshots
                                WHERE TenantId = @TenantId
                                    AND WorkspaceId = @WorkspaceId
                                    AND ProjectId = @ProjectId
                                    AND CaptureStatus IN (@SucceededStatus, @PartialStatus)
                                    AND (@SubscriptionId IS NULL OR SubscriptionId = @SubscriptionId);
                                """;

        const string listSql = """
                               SELECT
                                   SnapshotId, TenantId, WorkspaceId, ProjectId, PackageId,
                                   SubscriptionId, SubscriptionName, CapturedUtc, CaptureStatus, CaptureVersion,
                                   ResourceCount, RelationshipCount, CaptureMethod, CollectorVersion,
                                   RequestedBy, DurationMs, CompletenessScore, WarningCount, ErrorCount,
                                   ContentHashSha256, CreatedUtc, UpdatedUtc
                               FROM dbo.AzureInventorySnapshots
                               WHERE TenantId = @TenantId
                                   AND WorkspaceId = @WorkspaceId
                                   AND ProjectId = @ProjectId
                                   AND CaptureStatus IN (@SucceededStatus, @PartialStatus)
                                   AND (@SubscriptionId IS NULL OR SubscriptionId = @SubscriptionId)
                               ORDER BY COALESCE(CapturedUtc, CreatedUtc) DESC
                               OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY;
                               """;

        object parameters = new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            SucceededStatus = (int)AzureInventoryCaptureStatus.Succeeded,
            PartialStatus = (int)AzureInventoryCaptureStatus.Partial,
            SubscriptionId = string.IsNullOrWhiteSpace(subscriptionId) ? null : subscriptionId.Trim(),
            Skip = skip,
            PageSize = safePageSize,
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

        IReadOnlyList<AzureInventorySnapshotRecord> items = rows.Select(Map).ToList();

        return (items, totalCount);
    }
}
