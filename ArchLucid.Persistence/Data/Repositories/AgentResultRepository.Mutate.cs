using System.Data;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class AgentResultRepository
{
    /// <summary>
    ///     Persists one agent result row. Duplicate <c>(RunId, TaskId)</c> inserts fail with
    ///     <see cref="ArchLucid.Core.Persistence.AgentResultDuplicateConflictException" /> (see TB-201 unique index).
    /// </summary>
    public async Task CreateAsync(
        AgentResult result,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(result);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                AgentResultWriteSql.Insert,
                AgentResultInsertParameters.Create(result),
                transaction,
                cancellationToken: cancellationToken));
        }
        catch (SqlException ex) when (IsUniqueViolation(ex))
        {
            throw new AgentResultDuplicateConflictException(result.RunId, result.TaskId, ex);
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

        AgentResultRepositoryCore.RequireSingleRun(results);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken)
                .ConfigureAwait(false);

        IDbTransaction? localTransaction = null;

        try
        {
            // Only own a transaction when we also own the connection; otherwise the caller's unit of work governs.
            if (transaction is null && ownsConnection)
            {
                localTransaction = conn.BeginTransaction();
                transaction = localTransaction;
            }

            await AgentResultInsertBatch.ExecuteAsync(conn, transaction, results, cancellationToken)
                .ConfigureAwait(false);

            localTransaction?.Commit();
        }
        catch (SqlException ex) when (IsUniqueViolation(ex))
        {
            throw new AgentResultDuplicateConflictException(results[0].RunId, results[0].TaskId, ex);
        }
        finally
        {
            localTransaction?.Dispose();
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task ReplaceForRunTaskAsync(
        AgentResult replacement,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(replacement);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                AgentResultWriteSql.DeleteByRunTask,
                AgentResultInsertParameters.RunTaskKey(replacement.RunId, replacement.TaskId),
                transaction,
                cancellationToken: cancellationToken));

            await conn.ExecuteAsync(new CommandDefinition(
                AgentResultWriteSql.Insert,
                AgentResultInsertParameters.Create(replacement),
                transaction,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    /// <inheritdoc />
    public async Task DeleteForRunTaskAsync(
        string runId,
        string taskId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                AgentResultWriteSql.DeleteByRunTask,
                AgentResultInsertParameters.RunTaskKey(runId, taskId),
                transaction,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    private static bool IsUniqueViolation(SqlException exception) =>
        AgentResultRepositoryCore.IsUniqueViolation(exception);
}
