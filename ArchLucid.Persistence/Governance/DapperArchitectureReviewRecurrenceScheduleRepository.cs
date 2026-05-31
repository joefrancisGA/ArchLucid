using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Governance;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperArchitectureReviewRecurrenceScheduleRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureReviewRecurrenceScheduleRepository
{
    public async Task CreateAsync(ArchitectureReviewRecurrenceSchedule schedule, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(schedule);

        const string sql = """
            INSERT INTO dbo.ArchitectureReviewRecurrenceSchedules
            (
                ScheduleId, TenantId, WorkspaceId, ProjectId, SourceRunId,
                Name, CronExpression, IsEnabled, CreatedUtc, CreatedByUserId,
                LastTriggeredUtc, LastTriggeredRunId, NextRunUtc
            )
            VALUES
            (
                @ScheduleId, @TenantId, @WorkspaceId, @ProjectId, @SourceRunId,
                @Name, @CronExpression, @IsEnabled, @CreatedUtc, @CreatedByUserId,
                @LastTriggeredUtc, @LastTriggeredRunId, @NextRunUtc
            );
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(sql, schedule, cancellationToken: cancellationToken));
    }

    public async Task UpdateAsync(ArchitectureReviewRecurrenceSchedule schedule, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(schedule);

        const string sql = """
            UPDATE dbo.ArchitectureReviewRecurrenceSchedules
            SET
                Name = @Name,
                CronExpression = @CronExpression,
                IsEnabled = @IsEnabled,
                LastTriggeredUtc = @LastTriggeredUtc,
                LastTriggeredRunId = @LastTriggeredRunId,
                NextRunUtc = @NextRunUtc
            WHERE ScheduleId = @ScheduleId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(sql, schedule, cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>> ListDueAsync(
        DateTime utcNow,
        int take,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT TOP (@Take)
                ScheduleId, TenantId, WorkspaceId, ProjectId, SourceRunId,
                Name, CronExpression, IsEnabled, CreatedUtc, CreatedByUserId,
                LastTriggeredUtc, LastTriggeredRunId, NextRunUtc
            FROM dbo.ArchitectureReviewRecurrenceSchedules
            WHERE IsEnabled = 1
              AND NextRunUtc IS NOT NULL
              AND NextRunUtc <= @UtcNow
            ORDER BY NextRunUtc ASC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ArchitectureReviewRecurrenceSchedule> result = await connection.QueryAsync<ArchitectureReviewRecurrenceSchedule>(
            new CommandDefinition(
                sql,
                new { UtcNow = utcNow, Take = take },
                cancellationToken: cancellationToken));

        return result.ToList();
    }

    public async Task<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT
                ScheduleId, TenantId, WorkspaceId, ProjectId, SourceRunId,
                Name, CronExpression, IsEnabled, CreatedUtc, CreatedByUserId,
                LastTriggeredUtc, LastTriggeredRunId, NextRunUtc
            FROM dbo.ArchitectureReviewRecurrenceSchedules
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY CreatedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ArchitectureReviewRecurrenceSchedule> result = await connection.QueryAsync<ArchitectureReviewRecurrenceSchedule>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: cancellationToken));

        return result.ToList();
    }

    public async Task<ArchitectureReviewRecurrenceSchedule?> GetByIdAsync(
        Guid scheduleId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT
                ScheduleId, TenantId, WorkspaceId, ProjectId, SourceRunId,
                Name, CronExpression, IsEnabled, CreatedUtc, CreatedByUserId,
                LastTriggeredUtc, LastTriggeredRunId, NextRunUtc
            FROM dbo.ArchitectureReviewRecurrenceSchedules
            WHERE ScheduleId = @ScheduleId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureReviewRecurrenceSchedule>(
            new CommandDefinition(sql, new { ScheduleId = scheduleId }, cancellationToken: cancellationToken));
    }
}
