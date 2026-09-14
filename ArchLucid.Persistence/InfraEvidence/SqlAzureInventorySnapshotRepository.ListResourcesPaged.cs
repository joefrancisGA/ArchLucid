using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<(IReadOnlyList<AzureInventoryResourceRecord> Items, int TotalCount)?> ListResourcesBySnapshotIdPagedAsync(
        ScopeContext scope,
        Guid snapshotId,
        int page,
        int pageSize,
        Guid? cloudResourceId = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotRecord? header =
            await TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (header is null)
        {
            return null;
        }

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);
        bool filterByCloudResource = cloudResourceId is Guid resourceId && resourceId != Guid.Empty;
        string resourceFilter = filterByCloudResource ? " AND CloudResourceId = @CloudResourceId" : string.Empty;

        string countSql = $"""
                           SELECT COUNT(1)
                           FROM dbo.AzureInventoryResources
                           WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId{resourceFilter};
                           """;

        string listSql = $"""
                          SELECT ResourceRowId, SnapshotId, TenantId, CloudResourceId, AzureResourceId,
                                 ResourceType, Region, ResourceGroup, SubscriptionId, ParentResourceId,
                                 SourceEvidenceReference
                          FROM dbo.AzureInventoryResources
                          WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId{resourceFilter}
                          ORDER BY AzureResourceId
                          OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY;
                          """;

        object parameters = filterByCloudResource
            ? new
            {
                scope.TenantId,
                SnapshotId = snapshotId,
                CloudResourceId = cloudResourceId,
                Skip = skip,
                PageSize = safePageSize,
            }
            : new
            {
                scope.TenantId,
                SnapshotId = snapshotId,
                Skip = skip,
                PageSize = safePageSize,
            };

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int totalCount = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                countSql,
                parameters,
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        IEnumerable<AzureInventoryResourceRecord> rows = await conn.QueryAsync<AzureInventoryResourceRecord>(
            new CommandDefinition(
                listSql,
                parameters,
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        return (rows.ToList(), totalCount);
    }
}
