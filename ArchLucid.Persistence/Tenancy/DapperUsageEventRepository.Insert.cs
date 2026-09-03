using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;
using System.Text;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperUsageEventRepository
{
    private const string InsertSql = """
                                     INSERT INTO dbo.UsageEvents (Id, TenantId, WorkspaceId, ProjectId, Kind, Quantity, RecordedUtc, CorrelationId, IdempotencyKey)
                                     SELECT @Id, @TenantId, @WorkspaceId, @ProjectId, @Kind, @Quantity, @RecordedUtc, @CorrelationId, @IdempotencyKey
                                     WHERE @IdempotencyKey IS NULL
                                        OR NOT EXISTS (
                                            SELECT 1
                                            FROM dbo.UsageEvents e WITH (UPDLOCK, HOLDLOCK)
                                            WHERE e.TenantId = @TenantId
                                              AND e.IdempotencyKey = @IdempotencyKey);
                                     """;

    public async Task InsertAsync(UsageEvent usageEvent, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(usageEvent);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        await connection.ExecuteAsync(
            new CommandDefinition(
                InsertSql,
                MapParameters(usageEvent),
                cancellationToken: ct));
    }

    public async Task InsertBatchAsync(IReadOnlyList<UsageEvent> events, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(events);

        if (events.Count == 0)
            return;

        List<UsageEvent> eventsToInsert = UsageEventRepositoryCore.SelectDistinctIdempotencyKeysForBatchInsert(events);

        if (eventsToInsert.Count == 0)
            return;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction transaction = (SqlTransaction)await connection.BeginTransactionAsync(ct);

        const string insertHeader = """
                                    INSERT INTO dbo.UsageEvents (Id, TenantId, WorkspaceId, ProjectId, Kind, Quantity, RecordedUtc, CorrelationId, IdempotencyKey)
                                    SELECT v.Id, v.TenantId, v.WorkspaceId, v.ProjectId, v.Kind, v.Quantity, v.RecordedUtc, v.CorrelationId, v.IdempotencyKey
                                    FROM (VALUES
                                    """;

        const string insertFooter = """
                                    ) AS v(Id, TenantId, WorkspaceId, ProjectId, Kind, Quantity, RecordedUtc, CorrelationId, IdempotencyKey)
                                    WHERE v.IdempotencyKey IS NULL
                                       OR NOT EXISTS (
                                           SELECT 1
                                           FROM dbo.UsageEvents e WITH (UPDLOCK, HOLDLOCK)
                                           WHERE e.TenantId = v.TenantId
                                             AND e.IdempotencyKey = v.IdempotencyKey);
                                    """;

        await SqlChunkedDapperBatch.ExecuteChunksAsync(
            connection,
            transaction,
            eventsToInsert.Count,
            SqlChunkedDapperBatch.DefaultMaxRowsPerCommand,
            (offset, rowCount) => BuildUsageEventInsertChunk(insertHeader, insertFooter, eventsToInsert, offset, rowCount),
            ct).ConfigureAwait(false);

        await transaction.CommitAsync(ct);
    }

    private static object MapParameters(UsageEvent usageEvent) =>
        new
        {
            usageEvent.Id,
            usageEvent.TenantId,
            usageEvent.WorkspaceId,
            usageEvent.ProjectId,
            Kind = UsageMeterKindSql.ToKindString(usageEvent.Kind),
            usageEvent.Quantity,
            usageEvent.RecordedUtc,
            usageEvent.CorrelationId,
            usageEvent.IdempotencyKey
        };

    private static SqlChunkedBatchCommand BuildUsageEventInsertChunk(
        string insertHeader,
        string insertFooter,
        IReadOnlyList<UsageEvent> events,
        int offset,
        int rowCount)
    {
        StringBuilder commandText = new(insertHeader.Length + insertFooter.Length + rowCount * 100);
        commandText.Append(insertHeader);
        DynamicParameters parameters = new();

        for (int i = 0; i < rowCount; i++)
        {
            UsageEvent usageEvent = events[offset + i];

            if (i > 0)
                commandText.Append(',');

            commandText.Append(
                $"(@Id{i},@TenantId{i},@WorkspaceId{i},@ProjectId{i},@Kind{i},@Quantity{i},@RecordedUtc{i},@CorrelationId{i},@IdempotencyKey{i})");

            parameters.Add($"Id{i}", usageEvent.Id);
            parameters.Add($"TenantId{i}", usageEvent.TenantId);
            parameters.Add($"WorkspaceId{i}", usageEvent.WorkspaceId);
            parameters.Add($"ProjectId{i}", usageEvent.ProjectId);
            parameters.Add($"Kind{i}", UsageMeterKindSql.ToKindString(usageEvent.Kind));
            parameters.Add($"Quantity{i}", usageEvent.Quantity);
            parameters.Add($"RecordedUtc{i}", usageEvent.RecordedUtc);
            parameters.Add($"CorrelationId{i}", usageEvent.CorrelationId);
            parameters.Add($"IdempotencyKey{i}", usageEvent.IdempotencyKey);
        }

        commandText.Append(insertFooter);
        return new SqlChunkedBatchCommand(commandText.ToString(), parameters);
    }
}
