using System.Data.Common;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Data.Infrastructure;

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
        await using DbConnection _ = connection;
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

        List<string> deletedIds = [];

        await using DbTransaction transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            deletedIds = await definition.ExecuteTransactionalDeletes(
                connection,
                transaction,
                capped,
                candidateIds,
                cancellationToken).ConfigureAwait(false);

            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);
            throw;
        }

        if (deletedIds.Count > 0)
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = definition.AuditEventType,
                    DataJson = JsonSerializer.Serialize(definition.BuildAuditPayload(deletedIds))
                },
                cancellationToken).ConfigureAwait(false);

        return new DataConsistencyRemediationResult(false, deletedIds.Count, deletedIds);
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
