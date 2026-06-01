using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Persistence.Connections;

using Dapper;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Agents;

/// <summary>SQL ledger for structured tool-invocation rows (TB-110).</summary>
public sealed class SqlAgentToolInvocationRecordRepository(ISqlConnectionFactory connectionFactory)
    : IAgentToolInvocationRecordRepository
{
    public async Task ReplaceForTraceAsync(AgentToolInvocationRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (record.TenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(record));

        if (record.RunId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(record));

        const string deleteSql = """
                                 DELETE FROM dbo.AgentToolInvocationRecords
                                 WHERE TenantId = @TenantId AND TraceId = @TraceId;
                                 """;

        const string insertSql = """
                                 INSERT INTO dbo.AgentToolInvocationRecords (
                                     TenantId, RunId, TraceId, TaskId, SortOrder, ToolName, ArgsPreview,
                                     ResponseSummary, Outcome, DurationMs, BlobUploadFailed, CompletenessNote, InvokedAtUtc
                                 )
                                 VALUES (
                                     @TenantId, @RunId, @TraceId, @TaskId, @SortOrder, @ToolName, @ArgsPreview,
                                     @ResponseSummary, @Outcome, @DurationMs, @BlobUploadFailed, @CompletenessNote, @InvokedAtUtc
                                 );
                                 """;

        await using SqlConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                deleteSql,
                new { record.TenantId, record.TraceId },
                cancellationToken: cancellationToken));

        await conn.ExecuteAsync(
            new CommandDefinition(insertSql, MapParameters(record), cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AgentToolInvocationRecord>> ListByRunAsync(
        Guid tenantId,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        const string sql = """
                           SELECT TenantId, RunId, TraceId, TaskId, SortOrder, ToolName, ArgsPreview,
                                  ResponseSummary, Outcome, DurationMs, BlobUploadFailed, CompletenessNote, InvokedAtUtc
                           FROM dbo.AgentToolInvocationRecords
                           WHERE TenantId = @TenantId AND RunId = @RunId
                           ORDER BY InvokedAtUtc ASC, SortOrder ASC, TraceId ASC;
                           """;

        await using SqlConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentToolInvocationRecord> rows = await conn.QueryAsync<AgentToolInvocationRecord>(
            new CommandDefinition(sql, new { TenantId = tenantId, RunId = runId }, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    private static object MapParameters(AgentToolInvocationRecord record) => new
    {
        record.TenantId,
        record.RunId,
        record.TraceId,
        record.TaskId,
        record.SortOrder,
        record.ToolName,
        record.ArgsPreview,
        record.ResponseSummary,
        record.Outcome,
        record.DurationMs,
        record.BlobUploadFailed,
        record.CompletenessNote,
        InvokedAtUtc = record.InvokedAtUtc,
    };
}
