using System.Data.Common;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Transactions;

namespace ArchLucid.Host.Core.DataConsistency;

/// <inheritdoc cref="IDataConsistencyRemediationExecutor" />
public sealed class DataConsistencyRemediationExecutor(
    IDbConnectionFactory connectionFactory,
    IAuditService auditService) : IDataConsistencyRemediationExecutor
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc />
    public async Task<DataConsistencyRemediationResult> ExecuteAsync(
        DataConsistencyRemediationDefinition definition,
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(definition);

        int capped = Math.Clamp(maxRows, 1, PaginationDefaults.MaxListingTake);
        DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();

        // Dry-run and zero-candidate paths own their connection directly. After
        // a transaction starts, the existing Dapper UoW owns both connection
        // and transaction, including rollback/disposal on failure.
        bool handedOffToUnitOfWork = false;

        try
        {
            await connection.OpenAsync(cancellationToken);

            List<string> candidateIds = await SelectCandidateIdsAsync(
                connection,
                definition,
                capped,
                cancellationToken).ConfigureAwait(false);

            if (dryRun)
                return new DataConsistencyRemediationResult(true, candidateIds.Count, candidateIds);

            if (candidateIds.Count == 0)
                return new DataConsistencyRemediationResult(false, 0, []);

            DbTransaction transaction = await connection.BeginTransactionAsync(cancellationToken);
            await using DapperArchLucidUnitOfWork unitOfWork = new(connection, transaction);
            handedOffToUnitOfWork = true;

            try
            {
                List<string> deletedIds = await definition.ExecuteTransactionalDeletes(
                    connection,
                    transaction,
                    capped,
                    candidateIds,
                    cancellationToken).ConfigureAwait(false);

                if (deletedIds.Count > 0)
                {
                    // Reuse the existing audit UoW overload so the deletion and
                    // durable audit row co-commit. If the append fails, roll back
                    // both; never return a committed mutation without its audit.
                    await _auditService.LogAsync(
                        new AuditEvent
                        {
                            EventType = definition.AuditEventType,
                            DataJson = JsonSerializer.Serialize(definition.BuildAuditPayload(deletedIds))
                        },
                        unitOfWork,
                        cancellationToken).ConfigureAwait(false);
                }

                // This existing UoW commits synchronously; explicitly honor
                // cancellation before committing the audited mutation.
                cancellationToken.ThrowIfCancellationRequested();
                await unitOfWork.CommitAsync(cancellationToken).ConfigureAwait(false);

                return new DataConsistencyRemediationResult(false, deletedIds.Count, deletedIds);
            }
            catch
            {
                await unitOfWork.RollbackAsync(cancellationToken).ConfigureAwait(false);
                throw;
            }
        }
        finally
        {
            if (!handedOffToUnitOfWork)
                await connection.DisposeAsync().ConfigureAwait(false);
        }
    }

    private static async Task<List<string>> SelectCandidateIdsAsync(
        DbConnection connection,
        DataConsistencyRemediationDefinition definition,
        int capped,
        CancellationToken cancellationToken)
    {
        List<string> candidateIds = [];

        await using DbCommand selectCommand = connection.CreateCommand();
        selectCommand.CommandText = definition.SelectCandidateIdsSql;
        DataConsistencyRemediationSqlCommandHelpers.AddMaxRowsParameter(selectCommand, capped);

        await using DbDataReader reader = await selectCommand.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            candidateIds.Add(definition.ReadCandidateId(reader));

        return candidateIds;
    }
}
