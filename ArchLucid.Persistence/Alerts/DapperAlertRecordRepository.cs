using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Pagination;
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
    private const string SelectColumns = """
        AlertId, RuleId, TenantId, WorkspaceId, ProjectId,
        RunId, ComparedToRunId, RecommendationId,
        Title, Category, Severity, Status,
        TriggerValue, Description, CreatedUtc, LastUpdatedUtc,
        AcknowledgedByUserId, AcknowledgedByUserName, ResolutionComment,
        DeduplicationKey, IsArchived
        """;

    /// <inheritdoc />
    public async Task CreateAsync(AlertRecord alert, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(alert);

        const string sql = """
            INSERT INTO dbo.AlertRecords
            (
                AlertId, RuleId, TenantId, WorkspaceId, ProjectId,
                RunId, ComparedToRunId, RecommendationId,
                Title, Category, Severity, Status,
                TriggerValue, Description, CreatedUtc, LastUpdatedUtc,
                AcknowledgedByUserId, AcknowledgedByUserName, ResolutionComment,
                DeduplicationKey, IsArchived
            )
            VALUES
            (
                @AlertId, @RuleId, @TenantId, @WorkspaceId, @ProjectId,
                @RunId, @ComparedToRunId, @RecommendationId,
                @Title, @Category, @Severity, @Status,
                @TriggerValue, @Description, @CreatedUtc, @LastUpdatedUtc,
                @AcknowledgedByUserId, @AcknowledgedByUserName, @ResolutionComment,
                @DeduplicationKey, @IsArchived
            );
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, alert, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task UpdateAsync(AlertRecord alert, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(alert);

        const string sql = """
            UPDATE dbo.AlertRecords
            SET
                Status = @Status,
                LastUpdatedUtc = @LastUpdatedUtc,
                AcknowledgedByUserId = @AcknowledgedByUserId,
                AcknowledgedByUserName = @AcknowledgedByUserName,
                ResolutionComment = @ResolutionComment
            WHERE AlertId = @AlertId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, alert, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task ArchiveAsync(Guid alertId, CancellationToken ct)
    {
        const string sql = """
            UPDATE dbo.AlertRecords
            SET IsArchived = 1,
                LastUpdatedUtc = @LastUpdatedUtc
            WHERE AlertId = @AlertId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { AlertId = alertId, LastUpdatedUtc = TimeProvider.System.UtcNowDateTime() },
            cancellationToken: ct));
    }

    public async Task<AlertRecord?> GetByIdAsync(Guid alertId, CancellationToken ct)
    {
        const string sql = $"""
            SELECT {SelectColumns}
            FROM dbo.AlertRecords
            WHERE AlertId = @AlertId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.QueryFirstOrDefaultAsync<AlertRecord>(
            new CommandDefinition(sql, new
            {
                AlertId = alertId
            }, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<AlertRecord?> GetOpenByDeduplicationKeyAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string deduplicationKey,
        CancellationToken ct)
    {
        const string sql = $"""
            SELECT TOP 1 {SelectColumns}
            FROM dbo.AlertRecords
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND DeduplicationKey = @DeduplicationKey
              AND IsArchived = 0
              AND Status IN ('Open', 'Acknowledged')
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
        const string sql = $"""
            SELECT TOP (@Take) {SelectColumns}
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
                    Take = Math.Clamp(take, 1, 500),
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
        take = Math.Clamp(take, 1, PaginationDefaults.MaxPageSize);
        skip = Math.Max(skip, 0);

        const string countSql = """
            SELECT COUNT(*)
            FROM dbo.AlertRecords
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND (@Status IS NULL OR Status = @Status)
              AND (@IncludeArchived = 1 OR IsArchived = 0);
            """;

        const string pageSql = $"""
            SELECT {SelectColumns}
            FROM dbo.AlertRecords
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND (@Status IS NULL OR Status = @Status)
              AND (@IncludeArchived = 1 OR IsArchived = 0)
            ORDER BY CreatedUtc DESC
            OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY;
            """;

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
        int total = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, parameters, cancellationToken: ct));
        IEnumerable<AlertRecord> rows = await connection.QueryAsync<AlertRecord>(
            new CommandDefinition(pageSql, parameters, cancellationToken: ct));

        return (rows.ToList(), total);
    }
}
