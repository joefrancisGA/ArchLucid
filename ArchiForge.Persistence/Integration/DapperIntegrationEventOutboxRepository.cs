using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchiForge.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchiForge.Persistence.Integration;

/// <summary>Dapper implementation over <c>dbo.IntegrationEventOutbox</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperIntegrationEventOutboxRepository(ISqlConnectionFactory connectionFactory)
    : IIntegrationEventOutboxRepository
{
    /// <inheritdoc />
    public async Task EnqueueAsync(
        Guid runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        Guid outboxId = Guid.NewGuid();
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        await EnqueueCoreAsync(
            connection,
            null,
            outboxId,
            runId,
            eventType,
            messageId,
            payloadUtf8,
            tenantId,
            workspaceId,
            projectId,
            ct);
    }

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(transaction);

        Guid outboxId = Guid.NewGuid();

        return EnqueueCoreAsync(
            connection,
            transaction,
            outboxId,
            runId,
            eventType,
            messageId,
            payloadUtf8,
            tenantId,
            workspaceId,
            projectId,
            ct);
    }

    private static async Task EnqueueCoreAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid outboxId,
        Guid runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        byte[] bytes = payloadUtf8.ToArray();

        const string sql = """
            INSERT INTO dbo.IntegrationEventOutbox
            (OutboxId, RunId, EventType, MessageId, PayloadUtf8, TenantId, WorkspaceId, ProjectId, CreatedUtc)
            VALUES (@OutboxId, @RunId, @EventType, @MessageId, @PayloadUtf8, @TenantId, @WorkspaceId, @ProjectId, SYSUTCDATETIME());
            """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    EventType = eventType,
                    MessageId = messageId,
                    PayloadUtf8 = bytes,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId
                },
                transaction: transaction,
                cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<IntegrationEventOutboxEntry>> DequeuePendingAsync(int maxBatch, CancellationToken ct)
    {
        int take = Math.Clamp(maxBatch, 1, 100);

        const string sql = """
            SELECT TOP (@Take)
                OutboxId, RunId, EventType, MessageId, PayloadUtf8, TenantId, WorkspaceId, ProjectId, CreatedUtc
            FROM dbo.IntegrationEventOutbox
            WHERE ProcessedUtc IS NULL
            ORDER BY CreatedUtc ASC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        IEnumerable<IntegrationEventOutboxRow> rows = await connection.QueryAsync<IntegrationEventOutboxRow>(
            new CommandDefinition(sql, new { Take = take }, cancellationToken: ct));

        List<IntegrationEventOutboxEntry> list = [];

        foreach (IntegrationEventOutboxRow row in rows)
        {
            if (row.PayloadUtf8 is null || row.EventType is null)
            {
                continue;
            }

            list.Add(
                new IntegrationEventOutboxEntry
                {
                    OutboxId = row.OutboxId,
                    RunId = row.RunId,
                    EventType = row.EventType,
                    MessageId = row.MessageId,
                    PayloadUtf8 = row.PayloadUtf8,
                    TenantId = row.TenantId,
                    WorkspaceId = row.WorkspaceId,
                    ProjectId = row.ProjectId,
                    CreatedUtc = row.CreatedUtc
                });
        }

        return list;
    }

    /// <inheritdoc />
    public async Task MarkProcessedAsync(Guid outboxId, CancellationToken ct)
    {
        const string sql = """
            UPDATE dbo.IntegrationEventOutbox
            SET ProcessedUtc = SYSUTCDATETIME()
            WHERE OutboxId = @OutboxId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        await connection.ExecuteAsync(new CommandDefinition(sql, new { OutboxId = outboxId }, cancellationToken: ct));
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local", Justification = "Dapper materialization.")]
    private sealed class IntegrationEventOutboxRow
    {
        public Guid OutboxId { get; init; }

        public Guid? RunId { get; init; }

        public string? EventType { get; init; }

        public string? MessageId { get; init; }

        public byte[]? PayloadUtf8 { get; init; }

        public Guid TenantId { get; init; }

        public Guid WorkspaceId { get; init; }

        public Guid ProjectId { get; init; }

        public DateTime CreatedUtc { get; init; }
    }
}
