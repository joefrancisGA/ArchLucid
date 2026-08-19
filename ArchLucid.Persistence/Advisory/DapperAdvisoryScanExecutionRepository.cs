using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Advisory;

/// <summary>
/// SQL Server implementation of <see cref="IAdvisoryScanExecutionRepository"/> against <c>dbo.AdvisoryScanExecutions</c>.
/// </summary>
/// <remarks>Registered scoped in DI when SQL storage is enabled.</remarks>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperAdvisoryScanExecutionRepository(ISqlConnectionFactory connectionFactory)
    : IAdvisoryScanExecutionRepository
{
    /// <inheritdoc />
    public async Task CreateAsync(AdvisoryScanExecution execution, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(execution);
        const string sql = """
            INSERT INTO dbo.AdvisoryScanExecutions
            (
                ExecutionId, ScheduleId, TenantId, WorkspaceId, ProjectId,
                StartedUtc, CompletedUtc, Status, ResultJson, ErrorMessage
            )
            VALUES
            (
                @ExecutionId, @ScheduleId, @TenantId, @WorkspaceId, @ProjectId,
                @StartedUtc, @CompletedUtc, @Status, @ResultJson, @ErrorMessage
            );
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, execution, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task UpdateAsync(AdvisoryScanExecution execution, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(execution);
        const string sql = """
            UPDATE dbo.AdvisoryScanExecutions
            SET
                CompletedUtc = @CompletedUtc,
                Status = @Status,
                ResultJson = @ResultJson,
                ErrorMessage = @ErrorMessage
            WHERE ExecutionId = @ExecutionId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, execution, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AdvisoryScanExecution>> ListByScheduleAsync(
        Guid scheduleId,
        int take,
        CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (@Take)
                ExecutionId, ScheduleId, TenantId, WorkspaceId, ProjectId,
                StartedUtc, CompletedUtc, Status, ErrorMessage
            FROM dbo.AdvisoryScanExecutions
            WHERE ScheduleId = @ScheduleId
            ORDER BY StartedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<AdvisoryScanExecutionListRow> result = await connection.QueryAsync<AdvisoryScanExecutionListRow>(
            new CommandDefinition(sql, new
            {
                ScheduleId = scheduleId,
                Take = Math.Clamp(take, 1, 200)
            }, cancellationToken: ct));

        return result
            .Select(static row => new AdvisoryScanExecution
            {
                ExecutionId = row.ExecutionId,
                ScheduleId = row.ScheduleId,
                TenantId = row.TenantId,
                WorkspaceId = row.WorkspaceId,
                ProjectId = row.ProjectId,
                StartedUtc = row.StartedUtc,
                CompletedUtc = row.CompletedUtc,
                Status = row.Status,
                ErrorMessage = row.ErrorMessage,
                ResultJson = string.Empty,
            })
            .ToList();
    }

    private sealed class AdvisoryScanExecutionListRow
    {
        public Guid ExecutionId
        {
            get;
            init;
        }

        public Guid ScheduleId
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

        public DateTime StartedUtc
        {
            get;
            init;
        }

        public DateTime? CompletedUtc
        {
            get;
            init;
        }

        public string Status
        {
            get;
            init;
        } = "Started";

        public string? ErrorMessage
        {
            get;
            init;
        }
    }
}
