using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Tenancy;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GcpExtractor;

public sealed partial class SqlTenantGcpConnectionRepository
{
    private async Task<TenantGcpConnectionRecord?> TryGetCoreAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    ProjectId,
                                    WorkloadIdentityPoolProvider,
                                    ServiceAccountEmail,
                                    Status,
                                    LastPolledUtc,
                                    CreatedUtc,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantGcpConnectionRecords
                             WHERE TenantId = @TenantId
                               AND ConnectionId = @ConnectionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, ConnectionId = connectionId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return row?.ToRecord();
    }

    private async Task<TenantGcpConnectionRecord?> TryGetByProjectCoreAsync(
        Guid tenantId,
        string projectId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        string normalizedProjectId = NormalizeProjectId(projectId);

        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    ProjectId,
                                    WorkloadIdentityPoolProvider,
                                    ServiceAccountEmail,
                                    Status,
                                    LastPolledUtc,
                                    CreatedUtc,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantGcpConnectionRecords
                             WHERE TenantId = @TenantId
                               AND ProjectId = @ProjectId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, ProjectId = normalizedProjectId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return row?.ToRecord();
    }

    private async Task<IReadOnlyList<TenantGcpConnectionRecord>> ListByTenantCoreAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    ProjectId,
                                    WorkloadIdentityPoolProvider,
                                    ServiceAccountEmail,
                                    Status,
                                    LastPolledUtc,
                                    CreatedUtc,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantGcpConnectionRecords
                             WHERE TenantId = @TenantId
                             ORDER BY UpdatedUtc DESC;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Row> rows = await connection.QueryAsync<Row>(
                new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return rows.Select(row => row.ToRecord()).ToList();
    }

    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "ListActiveConnectionsAsync is a cross-tenant background-poller scan; it intentionally reads all active connections across all tenants and is invoked only by the hosted connection-health job identity.")]
    private async Task<IReadOnlyList<TenantGcpConnectionRecord>> ListActiveConnectionsCoreAsync(
        CancellationToken cancellationToken)
    {
        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    ProjectId,
                                    WorkloadIdentityPoolProvider,
                                    ServiceAccountEmail,
                                    Status,
                                    LastPolledUtc,
                                    CreatedUtc,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantGcpConnectionRecords
                             WHERE Status <> @Disconnected
                             ORDER BY UpdatedUtc DESC;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Row> rows = await connection.QueryAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { Disconnected = GcpConnectionStatus.Disconnected.ToString() },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return rows.Select(row => row.ToRecord()).ToList();
    }

    private static string NormalizeProjectId(string projectId) =>
        projectId.Trim();

    private sealed class Row
    {
        public Guid ConnectionId { get; init; }

        public Guid TenantId { get; init; }

        public string ProjectId { get; init; } = string.Empty;

        public string WorkloadIdentityPoolProvider { get; init; } = string.Empty;

        public string ServiceAccountEmail { get; init; } = string.Empty;

        public string Status { get; init; } = string.Empty;

        public DateTimeOffset? LastPolledUtc { get; init; }

        public DateTimeOffset CreatedUtc { get; init; }

        public DateTimeOffset UpdatedUtc { get; init; }

        public string UpdatedByActorId { get; init; } = string.Empty;

        public TenantGcpConnectionRecord ToRecord() =>
            new()
            {
                ConnectionId = ConnectionId,
                TenantId = TenantId,
                ProjectId = ProjectId,
                WorkloadIdentityPoolProvider = WorkloadIdentityPoolProvider,
                ServiceAccountEmail = ServiceAccountEmail,
                Status = Enum.TryParse<GcpConnectionStatus>(Status, out GcpConnectionStatus parsed)
                    ? parsed
                    : GcpConnectionStatus.Connected,
                LastPolledUtc = LastPolledUtc,
                CreatedUtc = CreatedUtc,
                UpdatedUtc = UpdatedUtc,
                UpdatedByActorId = UpdatedByActorId
            };
    }
}
