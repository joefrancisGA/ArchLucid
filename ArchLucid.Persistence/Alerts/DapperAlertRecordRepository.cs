using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Alerts;

/// <summary>
/// Dapper-backed <see cref="IAlertRecordRepository"/> against <c>dbo.AlertRecords</c>.
/// </summary>
/// <param name="connectionFactory">Opened per call; callers rely on scoped factory in DI.</param>
/// <remarks>
/// <see cref="GetOpenByDeduplicationKeyAsync"/> matches SQL status filter <c>Open</c>/<c>Acknowledged</c> (see <see cref="AlertStatus"/> constants).
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperAlertRecordRepository(ISqlConnectionFactory connectionFactory) : IAlertRecordRepository
{
    /// <inheritdoc />
    public async Task CreateAsync(AlertRecord alert, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(alert);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(AlertRecordRepositoryCore.InsertSql, alert, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task UpdateAsync(AlertRecord alert, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(alert);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(AlertRecordRepositoryCore.UpdateStatusSql, alert, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task ArchiveAsync(Guid alertId, CancellationToken ct)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(
            AlertRecordRepositoryCore.ArchiveSql,
            new { AlertId = alertId, LastUpdatedUtc = TimeProvider.System.UtcNowDateTime() },
            cancellationToken: ct));
    }

    public async Task<AlertRecord?> GetByIdAsync(Guid alertId, CancellationToken ct)
    {
        string sql = $"""
            SELECT {AlertRecordRepositoryCore.SelectColumns}
            FROM dbo.AlertRecords
            WHERE AlertId = @AlertId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.QueryFirstOrDefaultAsync<AlertRecord>(
            new CommandDefinition(sql, new { AlertId = alertId }, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<AlertRecord?> GetOpenByDeduplicationKeyAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string deduplicationKey,
        CancellationToken ct)
    {
        string sql = $"""
            SELECT TOP 1 {AlertRecordRepositoryCore.SelectColumns}
            FROM dbo.AlertRecords
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND DeduplicationKey = @DeduplicationKey
              AND IsArchived = 0
              AND Status IN ('{AlertStatus.Open}', '{AlertStatus.Acknowledged}')
            ORDER BY CreatedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.QueryFirstOrDefaultAsync<AlertRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    DeduplicationKey = deduplicationKey,
                },
                cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AlertRecord>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        int take,
        bool includeArchived = false,
        CancellationToken ct = default)
    {
        string sql = $"""
            SELECT TOP (@Take) {AlertRecordRepositoryCore.SelectColumns}
            FROM dbo.AlertRecords
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND (@Status IS NULL OR Status = @Status)
              AND (@IncludeArchived = 1 OR IsArchived = 0)
            ORDER BY CreatedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<AlertRecord> rows = await connection.QueryAsync<AlertRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Status = status,
                    Take = AlertRecordRepositoryCore.ClampListTake(take),
                    IncludeArchived = includeArchived ? 1 : 0,
                },
                cancellationToken: ct));
        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<AlertRecord> Items, int TotalCount)> ListByScopePagedAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        int skip,
        int take,
        bool includeArchived = false,
        CancellationToken ct = default)
    {
        take = AlertRecordRepositoryCore.ClampPagedTake(take);
        skip = AlertRecordRepositoryCore.ClampPagedSkip(skip);

        string pageSql = $"""
            SELECT {AlertRecordRepositoryCore.SelectColumns}
            FROM dbo.AlertRecords
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND (@Status IS NULL OR Status = @Status)
              AND (@IncludeArchived = 1 OR IsArchived = 0)
            ORDER BY CreatedUtc DESC
            OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY;
            """;

        string batchSql = """
            SELECT COUNT(*)
            FROM dbo.AlertRecords
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND (@Status IS NULL OR Status = @Status)
              AND (@IncludeArchived = 1 OR IsArchived = 0);

            """
            + pageSql;

        object parameters = new
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Status = status,
            Skip = skip,
            Take = take,
            IncludeArchived = includeArchived ? 1 : 0,
        };

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(batchSql, parameters, cancellationToken: ct));

        int total = await multi.ReadSingleAsync<int>();
        IEnumerable<AlertRecord> rows = await multi.ReadAsync<AlertRecord>();

        return (rows.ToList(), total);
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<AlertRecord> Items, bool HasMore)> ListByScopeKeysetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        DateTime? cursorCreatedUtc,
        Guid? cursorAlertId,
        int take,
        bool includeArchived = false,
        CancellationToken ct = default)
    {
        AlertRecordRepositoryCore.ValidateAlertKeysetCursor(cursorCreatedUtc, cursorAlertId);

        int safeTake = AlertRecordRepositoryCore.ClampKeysetTake(take);
        int fetch = safeTake + 1;

        string sql = $"""
            SELECT {AlertRecordRepositoryCore.SelectColumns}
            FROM dbo.AlertRecords
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND (@Status IS NULL OR Status = @Status)
              AND (@IncludeArchived = 1 OR IsArchived = 0)
              AND (
                    (@CursorAlertId IS NULL AND @CursorCreatedUtc IS NULL)
                    OR (
                        AlertId <> @CursorAlertId
                        AND (
                            CreatedUtc < @CursorCreatedUtc
                            OR (CreatedUtc = @CursorCreatedUtc AND AlertId < @CursorAlertId)
                        )
                    )
                  )
            ORDER BY CreatedUtc DESC, AlertId DESC
            OFFSET 0 ROWS FETCH NEXT @Fetch ROWS ONLY;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<AlertRecord> rowsEnumerable = await connection.QueryAsync<AlertRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Status = status,
                    CursorCreatedUtc = cursorCreatedUtc,
                    CursorAlertId = cursorAlertId,
                    Fetch = fetch,
                    IncludeArchived = includeArchived ? 1 : 0,
                },
                cancellationToken: ct));

        List<AlertRecord> rows = rowsEnumerable.ToList();
        bool hasMore = rows.Count > safeTake;

        if (hasMore)
            rows.RemoveAt(rows.Count - 1);

        return (rows, hasMore);
    }


    /// <inheritdoc />
    public async Task<AlertsInboxSummaryDto> GetInboxSummaryByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct = default)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        AlertsInboxSummaryDto? row = await connection.QuerySingleOrDefaultAsync<AlertsInboxSummaryDto>(
            new CommandDefinition(
                AlertRecordRepositoryCore.InboxSummarySql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                },
                cancellationToken: ct));

        return row ?? new AlertsInboxSummaryDto();
    }
}
