using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class AgentEvaluationRepository(IDbConnectionFactory connectionFactory) : IAgentEvaluationRepository
{
    public async Task CreateManyAsync(
        IReadOnlyCollection<AgentEvaluationRecord> evaluations,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(evaluations);

        if (evaluations.Count == 0)
            return;

        List<string> distinctRunIds = evaluations.Select(e => e.RunId).Distinct().ToList();
        if (distinctRunIds.Count > 1)

            throw new ArgumentException(
                $"All evaluations in a batch must belong to the same run. " +
                $"Found distinct RunIds: {string.Join(", ", distinctRunIds)}.",
                nameof(evaluations));

        string runId = evaluations.First().RunId;

        const string deleteSql = "DELETE FROM AgentEvaluations WHERE RunId = @RunId;";

        const string insertSql = """
                                 INSERT INTO AgentEvaluations
                                 (
                                     EvaluationId,
                                     RunId,
                                     TargetAgentTaskId,
                                     EvaluationType,
                                     ConfidenceDelta,
                                     Rationale,
                                     EvaluationJson,
                                     CreatedUtc
                                 )
                                 VALUES
                                 (
                                     @EvaluationId,
                                     @RunId,
                                     @TargetAgentTaskId,
                                     @EvaluationType,
                                     @ConfidenceDelta,
                                     @Rationale,
                                     @EvaluationJson,
                                     @CreatedUtc
                                 );
                                 """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            if (transaction is not null)

                await ExecuteCreateManyCoreAsync(conn, transaction, evaluations, runId, deleteSql, insertSql,
                    cancellationToken);

            else
            {
                using IDbTransaction tx = conn.BeginTransaction();

                await ExecuteCreateManyCoreAsync(conn, tx, evaluations, runId, deleteSql, insertSql, cancellationToken);

                tx.Commit();
            }
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task<IReadOnlyList<AgentEvaluationRecord>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string sql = $"""
                      SELECT EvaluationJson
                      FROM AgentEvaluations
                      WHERE RunId = @RunId
                      ORDER BY CreatedUtc
                      {SqlPagingSyntax.FirstRowsOnly(500)};
                      """;

        IEnumerable<string> rows = await connection.QueryAsync<string>(new CommandDefinition(
            sql,
            new { RunId = runId },
            cancellationToken: cancellationToken));

        List<AgentEvaluationRecord> evaluations = [];
        foreach (string json in rows)
        {
            AgentEvaluationRecord? evaluation;
            try
            {
                evaluation = JsonSerializer.Deserialize<AgentEvaluationRecord>(json, ContractJson.Default);
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException(
                    $"Failed to deserialize an AgentEvaluationRecord for run '{runId}'. " +
                    "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
            }

            if (evaluation is null)

                throw new InvalidOperationException(
                    $"An AgentEvaluation row for run '{runId}' deserialized to null. " +
                    "The stored JSON may be empty or corrupt.");

            evaluations.Add(evaluation);
        }

        return evaluations;
    }

    private static async Task ExecuteCreateManyCoreAsync(
        IDbConnection conn,
        IDbTransaction tx,
        IReadOnlyCollection<AgentEvaluationRecord> evaluations,
        string runId,
        string deleteSql,
        string insertSql,
        CancellationToken cancellationToken)
    {
        await conn.ExecuteAsync(new CommandDefinition(
            deleteSql,
            new { RunId = runId },
            tx,
            cancellationToken: cancellationToken));

        foreach (AgentEvaluationRecord e in evaluations)
        {
            string payload = JsonSerializer.Serialize(e, ContractJson.Default);
            await conn.ExecuteAsync(new CommandDefinition(
                insertSql,
                new
                {
                    e.EvaluationId,
                    e.RunId,
                    e.TargetAgentTaskId,
                    e.EvaluationType,
                    e.ConfidenceDelta,
                    e.Rationale,
                    EvaluationJson = payload,
                    e.CreatedUtc
                },
                tx,
                cancellationToken: cancellationToken));
        }
    }
}
