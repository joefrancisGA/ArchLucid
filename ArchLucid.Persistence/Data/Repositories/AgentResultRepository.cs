using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class AgentResultRepository(IDbConnectionFactory connectionFactory) : IAgentResultRepository
{
    public async Task CreateAsync(
        AgentResult result,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(result);

        // Delete-then-insert by (RunId, TaskId) so that a duplicate submission from a
        // retrying agent replaces the previous row rather than violating a unique constraint.
        const string deleteSql = "DELETE FROM AgentResults WHERE RunId = @RunId AND TaskId = @TaskId;";

        const string insertSql = """
                                 INSERT INTO AgentResults
                                 (
                                     ResultId,
                                     TaskId,
                                     RunId,
                                     AgentType,
                                     Confidence,
                                     CalibratedConfidence,
                                     ProposedEvidenceJson,
                                     ResultJson,
                                     CreatedUtc
                                 )
                                 VALUES
                                 (
                                     @ResultId,
                                     @TaskId,
                                     @RunId,
                                     @AgentType,
                                     @Confidence,
                                     @CalibratedConfidence,
                                     @ProposedEvidenceJson,
                                     @ResultJson,
                                     @CreatedUtc
                                 );
                                 """;

        string json = JsonSerializer.Serialize(result, ContractJson.Default);
        object parameters = new
        {
            result.ResultId,
            result.TaskId,
            result.RunId,
            AgentType = result.AgentType.ToString(),
            result.Confidence,
            result.CalibratedConfidence,
            ProposedEvidenceJson = result.ProposedEvidenceJson,
            ResultJson = json,
            result.CreatedUtc
        };

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            if (transaction is not null)
            {
                await conn.ExecuteAsync(new CommandDefinition(
                    deleteSql,
                    new { result.RunId, result.TaskId },
                    transaction,
                    cancellationToken: cancellationToken));

                await conn.ExecuteAsync(new CommandDefinition(
                    insertSql,
                    parameters,
                    transaction,
                    cancellationToken: cancellationToken));
            }
            else
            {
                using IDbTransaction tx = conn.BeginTransaction();

                await conn.ExecuteAsync(new CommandDefinition(
                    deleteSql,
                    new { result.RunId, result.TaskId },
                    tx,
                    cancellationToken: cancellationToken));

                await conn.ExecuteAsync(new CommandDefinition(
                    insertSql,
                    parameters,
                    tx,
                    cancellationToken: cancellationToken));

                tx.Commit();
            }
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task CreateManyAsync(
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(results);

        if (results.Count == 0)
            return;

        List<string> distinctRunIds = results.Select(r => r.RunId).Distinct().ToList();
        if (distinctRunIds.Count > 1)

            throw new ArgumentException(
                $"All results in a batch must belong to the same run. " +
                $"Found distinct RunIds: {string.Join(", ", distinctRunIds)}.",
                nameof(results));

        // Delete all existing results for this run before bulk-inserting so that a retry
        // of ExecuteRunAsync (inside IArchLucidUnitOfWork) does not produce duplicate rows.
        const string deleteSql = "DELETE FROM AgentResults WHERE RunId = @RunId;";

        const string insertSql = """
                                 INSERT INTO AgentResults
                                 (
                                     ResultId,
                                     TaskId,
                                     RunId,
                                     AgentType,
                                     Confidence,
                                     CalibratedConfidence,
                                     ProposedEvidenceJson,
                                     ResultJson,
                                     CreatedUtc
                                 )
                                 VALUES
                                 (
                                     @ResultId,
                                     @TaskId,
                                     @RunId,
                                     @AgentType,
                                     @Confidence,
                                     @CalibratedConfidence,
                                     @ProposedEvidenceJson,
                                     @ResultJson,
                                     @CreatedUtc
                                 );
                                 """;

        IEnumerable<object> args = results.Select(result => (object)new
        {
            result.ResultId,
            result.TaskId,
            result.RunId,
            AgentType = result.AgentType.ToString(),
            result.Confidence,
            result.CalibratedConfidence,
            ProposedEvidenceJson = result.ProposedEvidenceJson,
            ResultJson = JsonSerializer.Serialize(result, ContractJson.Default),
            result.CreatedUtc
        });

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            if (transaction is not null)
            {
                await conn.ExecuteAsync(new CommandDefinition(
                    deleteSql,
                    new { results[0].RunId },
                    transaction,
                    cancellationToken: cancellationToken));

                await conn.ExecuteAsync(new CommandDefinition(insertSql, args, transaction,
                    cancellationToken: cancellationToken));
            }
            else
            {
                using IDbTransaction tx = conn.BeginTransaction();

                await conn.ExecuteAsync(new CommandDefinition(
                    deleteSql,
                    new { results[0].RunId },
                    tx,
                    cancellationToken: cancellationToken));

                await conn.ExecuteAsync(
                    new CommandDefinition(insertSql, args, tx, cancellationToken: cancellationToken));

                tx.Commit();
            }
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task<IReadOnlyList<AgentResult>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        string sql = $"""
                      SELECT ResultJson
                      FROM AgentResults
                      WHERE RunId = @RunId
                      ORDER BY CreatedUtc
                      {SqlPagingSyntax.FirstRowsOnly(1000)};
                      """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        IEnumerable<string> rows;
        try
        {
            rows = await conn.QueryAsync<string>(new CommandDefinition(
                sql,
                new { RunId = runId },
                transaction,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        List<AgentResult> results = [];
        foreach (string json in rows)
        {
            AgentResult? result;
            try
            {
                result = JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default);
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException(
                    $"Failed to deserialize an AgentResult for run '{runId}'. " +
                    "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
            }

            if (result is null)

                throw new InvalidOperationException(
                    $"An AgentResult row for run '{runId}' deserialized to null. " +
                    "The stored JSON may be empty or corrupt.");

            results.Add(result);
        }

        return results;
    }

    public async Task PatchCalibratedConfidenceAsync(
        string resultId,
        double calibratedConfidence,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);

        const string sql = """
                           UPDATE AgentResults
                           SET CalibratedConfidence = @CalibratedConfidence
                           WHERE ResultId = @ResultId;
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                sql,
                new { ResultId = resultId, CalibratedConfidence = calibratedConfidence },
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task PatchProposedEvidenceJsonAsync(
        string resultId,
        string proposedEvidenceJson,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);
        ArgumentException.ThrowIfNullOrWhiteSpace(proposedEvidenceJson);

        const string sql = """
                           UPDATE AgentResults
                           SET ProposedEvidenceJson = @ProposedEvidenceJson
                           WHERE ResultId = @ResultId;
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                sql,
                new { ResultId = resultId, ProposedEvidenceJson = proposedEvidenceJson },
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task<IReadOnlyList<EvidenceProposalListItem>> ListEvidenceProposalsAsync(
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT
                               ar.ResultId,
                               ar.RunId,
                               ar.AgentType,
                               ar.ProposedEvidenceJson,
                               ar.CreatedUtc,
                               CASE
                                   WHEN EXISTS (
                                       SELECT 1
                                       FROM TenantCuratedEvidenceEntries AS tce
                                       WHERE tce.SourceResultId = ar.ResultId)
                                   THEN CAST(1 AS BIT)
                                   ELSE CAST(0 AS BIT)
                               END AS IsPromoted
                           FROM AgentResults AS ar
                           WHERE ar.ProposedEvidenceJson IS NOT NULL
                           ORDER BY ar.CreatedUtc DESC;
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        IEnumerable<EvidenceProposalListItem> rows;
        try
        {
            rows = await conn.QueryAsync<EvidenceProposalListItem>(new CommandDefinition(
                sql,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        return rows.ToList();
    }

    public async Task<EvidenceProposalListItem?> TryGetEvidenceProposalAsync(
        string resultId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);

        const string sql = """
                           SELECT TOP (1)
                               ar.ResultId,
                               ar.RunId,
                               ar.AgentType,
                               ar.ProposedEvidenceJson,
                               ar.CreatedUtc,
                               CASE
                                   WHEN EXISTS (
                                       SELECT 1
                                       FROM TenantCuratedEvidenceEntries AS tce
                                       WHERE tce.SourceResultId = ar.ResultId)
                                   THEN CAST(1 AS BIT)
                                   ELSE CAST(0 AS BIT)
                               END AS IsPromoted
                           FROM AgentResults AS ar
                           WHERE ar.ResultId = @ResultId
                             AND ar.ProposedEvidenceJson IS NOT NULL;
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        try
        {
            return await conn.QuerySingleOrDefaultAsync<EvidenceProposalListItem>(new CommandDefinition(
                sql,
                new { ResultId = resultId },
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public Task MarkEvidenceProposalPromotedAsync(string resultId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
