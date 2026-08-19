using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Dapper;

namespace ArchLucid.Persistence.Repositories;

/// <inheritdoc cref="IRunTelemetryRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlRunTelemetryRepository(IDbConnectionFactory connectionFactory) : IRunTelemetryRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task InsertCommitMetricsIfAbsentAsync(RunCommitTelemetryWriteRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           IF NOT EXISTS (SELECT 1 FROM dbo.RunTelemetry WHERE RunId = @RunId)
                           INSERT INTO dbo.RunTelemetry (RunId, RequestDurationMs, AgentExecutionDurationMs, ManualReviewDurationMs, EstimatedHoursSaved)
                           VALUES (@RunId, @RequestDurationMs, @AgentExecutionDurationMs, @ManualReviewDurationMs, @EstimatedHoursSaved);
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    request.RunId,
                    RequestDurationMs = request.RequestDurationMs,
                    AgentExecutionDurationMs = request.AgentExecutionDurationMs,
                    ManualReviewDurationMs = request.ManualReviewDurationMs,
                    EstimatedHoursSaved = request.EstimatedHoursSaved
                },
                cancellationToken: cancellationToken));
    }
}
