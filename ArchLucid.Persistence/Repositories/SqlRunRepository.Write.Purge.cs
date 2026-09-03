using System.Data;

using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Models;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlRunRepository
{
    /// <inheritdoc />
    public async Task<RunStaleUncommittedPurgeBatchResult> HardDeleteStaleUncommittedRunsBatchAsync(
        DateTimeOffset createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        int safeBatch = RunRepositoryCore.ClampPurgeBatchSize(batchSize);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        IEnumerable<ArchivedRunScopeRow> rows = await connection.QueryAsync<ArchivedRunScopeRow>(
            new CommandDefinition(
                "dbo.Archival_PurgeStaleUncommittedRunsBatch",
                new
                {
                    CutoffUtc = createdBeforeUtc.UtcDateTime,
                    BatchSize = safeBatch
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct)).ConfigureAwait(false);

        List<ArchivedRunScopeRow> list = rows.AsList();

        return new RunStaleUncommittedPurgeBatchResult { Deleted = list };
    }

    /// <inheritdoc />
    public async Task<RunSamplePurgeBatchResult> HardDeleteSampleRunsBatchAsync(
        Guid? tenantId,
        DateTimeOffset? createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        int safeBatch = RunRepositoryCore.ClampPurgeBatchSize(batchSize);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        IEnumerable<ArchivedRunScopeRow> rows = await connection.QueryAsync<ArchivedRunScopeRow>(
            new CommandDefinition(
                "dbo.SampleRunPurgeBatch",
                new
                {
                    TenantId = tenantId,
                    CreatedBeforeUtc = createdBeforeUtc?.UtcDateTime,
                    BatchSize = safeBatch
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct)).ConfigureAwait(false);

        List<ArchivedRunScopeRow> list = rows.AsList();

        return new RunSamplePurgeBatchResult { Deleted = list };
    }
}
