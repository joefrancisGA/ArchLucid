using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Queries;

/// <summary>
///     Aggregates ROI telemetry (runs, hours saved, mean time-to-commit) for the caller's scope.
/// </summary>
/// <remarks>
///     The join to <c>dbo.Runs</c> carries the tenant/workspace/project predicate so the aggregate can never span
///     scopes, matching the row-level filtering applied by scoped repositories.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent query; requires live SQL Server for integration testing.")]
public static class RunRoiTelemetryAggregateQuery
{
    private const string Sql = """
                               SELECT
                                   COUNT(*) AS TotalRuns,
                                   SUM(t.EstimatedHoursSaved) AS TotalHoursSaved,
                                   AVG(t.RequestDurationMs + t.AgentExecutionDurationMs + t.ManualReviewDurationMs)
                                       AS AverageTimeToCommitMs
                               FROM dbo.RunTelemetry t
                               INNER JOIN dbo.Runs r ON t.RunId = r.RunId
                               WHERE r.TenantId = @TenantId
                                 AND r.WorkspaceId = @WorkspaceId
                                 AND r.ProjectId = @ProjectId;
                               """;

    /// <summary>Reads the scope rollup, returning <see cref="RunRoiTelemetryAggregate.Empty" /> when no rows match.</summary>
    public static async Task<RunRoiTelemetryAggregate> ReadAsync(
        IDbConnectionFactory connectionFactory,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(connectionFactory);
        ArgumentNullException.ThrowIfNull(scope);

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ArgumentNullException.ThrowIfNull(connection);

        AggregateRow? row = await connection.QueryFirstOrDefaultAsync<AggregateRow>(
            new CommandDefinition(
                Sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId
                },
                cancellationToken: cancellationToken));

        if (row is null)
            return RunRoiTelemetryAggregate.Empty;

        return new RunRoiTelemetryAggregate(
            row.TotalRuns,
            row.TotalHoursSaved ?? 0m,
            RoundToWholeMilliseconds(row.AverageTimeToCommitMs));
    }

    // SQL AVG over nullable duration columns yields a float; the contract exposes whole milliseconds.
    private static long RoundToWholeMilliseconds(double? averageMs)
    {
        return averageMs is { } value
            ? (long)Math.Round(value, MidpointRounding.AwayFromZero)
            : 0L;
    }

    private sealed class AggregateRow
    {
        public long TotalRuns
        {
            get;
            init;
        }

        public decimal? TotalHoursSaved
        {
            get;
            init;
        }

        public double? AverageTimeToCommitMs
        {
            get;
            init;
        }
    }
}
