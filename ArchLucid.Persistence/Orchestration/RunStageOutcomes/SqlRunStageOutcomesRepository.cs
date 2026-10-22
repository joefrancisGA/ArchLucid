using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Persistence.Connections;

using Dapper;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Orchestration.RunStageOutcomes;

/// <summary>Dapper persistence for <c>dbo.RunStageOutcomes</c> (TB-250).</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; covered by integration tests.")]
public sealed class SqlRunStageOutcomesRepository(ISqlConnectionFactory connectionFactory) : IRunStageOutcomesRepository
{
    public async Task RecordStageStartedAsync(
        Guid runId,
        string stageName,
        DateTime startedUtc,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ValidateRunAndStage(runId, stageName);

        const string sql = """
                           MERGE dbo.RunStageOutcomes AS target
                           USING (SELECT @RunId AS RunId, @StageName AS StageName) AS source
                           ON target.RunId = source.RunId AND target.StageName = source.StageName
                           WHEN MATCHED THEN
                               UPDATE SET
                                   StartedUtc = @StartedUtc,
                                   CompletedUtc = NULL,
                                   OutcomeStatus = N'running'
                           WHEN NOT MATCHED THEN
                               INSERT (RunId, StageName, StartedUtc, CompletedUtc, OutcomeStatus)
                               VALUES (@RunId, @StageName, @StartedUtc, NULL, N'running');
                           """;

        object parameters = new { RunId = runId, StageName = stageName, StartedUtc = startedUtc };

        if (connection is not null)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(sql, parameters, transaction, cancellationToken: cancellationToken));

            return;
        }

        await using SqlConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(new CommandDefinition(sql, parameters, cancellationToken: cancellationToken));
    }

    public async Task RecordStageCompletedAsync(
        Guid runId,
        string stageName,
        string outcomeStatus,
        DateTime completedUtc,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ValidateRunAndStage(runId, stageName);

        if (string.IsNullOrWhiteSpace(outcomeStatus))
            throw new ArgumentException("Outcome status is required.", nameof(outcomeStatus));

        const string sql = """
                           UPDATE dbo.RunStageOutcomes
                           SET CompletedUtc = @CompletedUtc,
                               OutcomeStatus = @OutcomeStatus
                           WHERE RunId = @RunId AND StageName = @StageName;
                           """;

        object parameters = new
        {
            RunId = runId,
            StageName = stageName,
            CompletedUtc = completedUtc,
            OutcomeStatus = outcomeStatus,
        };

        if (connection is not null)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(sql, parameters, transaction, cancellationToken: cancellationToken));

            return;
        }

        await using SqlConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(new CommandDefinition(sql, parameters, cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<StageTimelineSummary>> ListByRunIdAsync(
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        const string sql = """
                           SELECT StageName, StartedUtc, CompletedUtc, OutcomeStatus
                           FROM dbo.RunStageOutcomes
                           WHERE RunId = @RunId
                           ORDER BY StartedUtc ASC, StageName ASC;
                           """;

        await using SqlConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RunStageOutcomeRow> rows = await conn.QueryAsync<RunStageOutcomeRow>(
            new CommandDefinition(sql, new { RunId = runId }, cancellationToken: cancellationToken));

        return rows
            .Select(static row => StageTimelineSummary.FromRow(
                row.StageName,
                row.StartedUtc,
                row.CompletedUtc,
                row.OutcomeStatus))
            .ToList();
    }

    private static void ValidateRunAndStage(Guid runId, string stageName)
    {
        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (string.IsNullOrWhiteSpace(stageName))
            throw new ArgumentException("Stage name is required.", nameof(stageName));
    }

    private sealed class RunStageOutcomeRow
    {
        public string StageName { get; init; } = string.Empty;

        public DateTime StartedUtc { get; init; }

        public DateTime? CompletedUtc { get; init; }

        public string OutcomeStatus { get; init; } = string.Empty;
    }
}
