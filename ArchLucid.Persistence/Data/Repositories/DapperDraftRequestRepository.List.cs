using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class DapperDraftRequestRepository
{
    /// <inheritdoc />
    public async Task<PagedResponse<DraftRequestResponse>> ListForCreatorInWorkspaceAsync(
        Guid tenantId,
        Guid workspaceId,
        string createdByUserId,
        IReadOnlyList<DraftRequestStatus> statuses,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByUserId);

        if (statuses is null || statuses.Count == 0)
            throw new ArgumentException("At least one status filter is required.", nameof(statuses));

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);
        IReadOnlyList<string> statusNames = statuses.Select(static status => status.ToString()).ToList();

        const string countSql = """
                                SELECT COUNT(1)
                                FROM dbo.DraftRequests
                                WHERE TenantId = @TenantId
                                  AND WorkspaceId = @WorkspaceId
                                  AND CreatedByUserId = @CreatedByUserId
                                  AND Status IN @Statuses;
                                """;

        const string pageSql = """
                               SELECT
                                   DraftId,
                                   TenantId,
                                   WorkspaceId,
                                   ProjectId,
                                   Status,
                                   DocumentJson,
                                   RedirectReason,
                                   SpawnedRunId,
                                   SpawnedArchitectureVersionId,
                                   CreatedByUserId,
                                   CreatedUtc,
                                   UpdatedUtc
                               FROM dbo.DraftRequests
                               WHERE TenantId = @TenantId
                                 AND WorkspaceId = @WorkspaceId
                                 AND CreatedByUserId = @CreatedByUserId
                                 AND Status IN @Statuses
                               ORDER BY UpdatedUtc DESC
                               OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY;
                               """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        object parameters = new
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            CreatedByUserId = createdByUserId,
            Statuses = statusNames,
            Skip = skip,
            PageSize = safePageSize,
        };

        int totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken));

        IEnumerable<DraftRequestRow> rows = await connection.QueryAsync<DraftRequestRow>(
            new CommandDefinition(pageSql, parameters, cancellationToken: cancellationToken));

        IReadOnlyList<DraftRequestResponse> items = rows.Select(MapRow).ToList();

        return PagedResponseBuilder.FromDatabasePage(items, totalCount, safePage, safePageSize);
    }
}
