using System.Data.Common;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Executes guard → clamp → SELECT → dry-run → transactional DELETE → audit for orphan remediation.
/// </summary>
public sealed class DataConsistencyRemediationExecutor(
    IDbConnectionFactory connectionFactory,
    IAuditService auditService)
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<DataConsistencyRemediationOutcome> ExecuteAsync(
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

        List<string> candidateIds = await ReadCandidateIdsAsync(
            connection,
            definition,
            capped,
            cancellationToken);

        if (dryRun)
            return new DataConsistencyRemediationOutcome(true, candidateIds.Count, candidateIds);

        if (candidateIds.Count == 0)
            return new DataConsistencyRemediationOutcome(false, 0, []);

        List<string> deletedIds = [];

        await using DbTransaction transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            deletedIds = await definition.DeleteCandidatesAsync(
                connection,
                transaction,
                candidateIds,
                capped,
                cancellationToken);

            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        if (deletedIds.Count > 0)
            await LogRemediationAuditAsync(definition, deletedIds, cancellationToken);

        return new DataConsistencyRemediationOutcome(false, deletedIds.Count, deletedIds);
    }

    private static async Task<List<string>> ReadCandidateIdsAsync(
        DbConnection connection,
        DataConsistencyRemediationDefinition definition,
        int cappedMaxRows,
        CancellationToken cancellationToken)
    {
        List<string> candidateIds = [];

        await using DbCommand selectCommand = connection.CreateCommand();
        selectCommand.CommandText = definition.SelectSql;
        DataConsistencyRemediationSqlHelpers.AddMaxRowsParameter(selectCommand, cappedMaxRows);

        await using DbDataReader reader = await selectCommand.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))

            candidateIds.Add(definition.ReadCandidateId(reader));

        return candidateIds;
    }

    private async Task LogRemediationAuditAsync(
        DataConsistencyRemediationDefinition definition,
        List<string> deletedIds,
        CancellationToken cancellationToken)
    {
        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = definition.AuditEventType,
                DataJson = JsonSerializer.Serialize(
                    new Dictionary<string, object?>
                    {
                        ["dryRun"] = false,
                        ["deletedCount"] = deletedIds.Count,
                        [definition.AuditIdsJsonPropertyName] = deletedIds
                    })
            },
            cancellationToken);
    }
}
