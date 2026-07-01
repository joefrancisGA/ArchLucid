using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GcpExtractor;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via unit/API tests with in-memory repo.")]
public sealed class SqlTenantGcpConnectionRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantGcpConnectionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantGcpConnectionRecord?> TryGetAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => TryGetCoreAsync(tenantId, connectionId, ct),
            cancellationToken);

    public Task<TenantGcpConnectionRecord?> TryGetByProjectAsync(
        Guid tenantId,
        string projectId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => TryGetByProjectCoreAsync(tenantId, projectId, ct),
            cancellationToken);

    public Task UpsertAsync(TenantGcpConnectionRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => UpsertCoreAsync(record, ct), cancellationToken);

    public Task UpdateStatusAsync(
        Guid tenantId,
        Guid connectionId,
        GcpConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => UpdateStatusCoreAsync(tenantId, connectionId, status, lastPolledUtc, updatedByActorId, ct),
            cancellationToken);

    public Task DeleteAsync(Guid tenantId, Guid connectionId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => DeleteCoreAsync(tenantId, connectionId, ct), cancellationToken);

    public Task<IReadOnlyList<TenantGcpConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListByTenantCoreAsync(tenantId, ct), cancellationToken);

    public Task<IReadOnlyList<TenantGcpConnectionRecord>> ListActiveConnectionsAsync(
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListActiveConnectionsCoreAsync(ct), cancellationToken);

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

    private async Task UpsertCoreAsync(TenantGcpConnectionRecord record, CancellationToken cancellationToken)
    {
        if (record.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(record));

        ArgumentException.ThrowIfNullOrWhiteSpace(record.ProjectId);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.WorkloadIdentityPoolProvider);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.ServiceAccountEmail);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.UpdatedByActorId);

        string normalizedProjectId = NormalizeProjectId(record.ProjectId);
        Guid connectionId = record.ConnectionId == Guid.Empty ? Guid.NewGuid() : record.ConnectionId;

        const string sql = """
                             MERGE dbo.TenantGcpConnectionRecords AS target
                             USING (SELECT @TenantId AS TenantId, @ProjectId AS ProjectId) AS source
                             ON target.TenantId = source.TenantId
                               AND target.ProjectId = source.ProjectId
                             WHEN MATCHED THEN
                                 UPDATE SET
                                     WorkloadIdentityPoolProvider = @WorkloadIdentityPoolProvider,
                                     ServiceAccountEmail = @ServiceAccountEmail,
                                     Status = @Status,
                                     LastPolledUtc = @LastPolledUtc,
                                     UpdatedUtc = SYSUTCDATETIME(),
                                     UpdatedByActorId = @UpdatedByActorId
                             WHEN NOT MATCHED THEN
                                 INSERT (ConnectionId, TenantId, ProjectId, WorkloadIdentityPoolProvider,
                                         ServiceAccountEmail, Status, LastPolledUtc, CreatedUtc, UpdatedUtc,
                                         UpdatedByActorId)
                                 VALUES (@ConnectionId, @TenantId, @ProjectId, @WorkloadIdentityPoolProvider,
                                         @ServiceAccountEmail, @Status, @LastPolledUtc, SYSUTCDATETIME(),
                                         SYSUTCDATETIME(), @UpdatedByActorId);
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        ConnectionId = connectionId,
                        record.TenantId,
                        ProjectId = normalizedProjectId,
                        WorkloadIdentityPoolProvider = record.WorkloadIdentityPoolProvider.Trim(),
                        ServiceAccountEmail = record.ServiceAccountEmail.Trim(),
                        Status = record.Status.ToString(),
                        record.LastPolledUtc,
                        record.UpdatedByActorId
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private async Task UpdateStatusCoreAsync(
        Guid tenantId,
        Guid connectionId,
        GcpConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        ArgumentException.ThrowIfNullOrWhiteSpace(updatedByActorId);

        const string sql = """
                             UPDATE dbo.TenantGcpConnectionRecords
                             SET Status = @Status,
                                 LastPolledUtc = COALESCE(@LastPolledUtc, LastPolledUtc),
                                 UpdatedUtc = SYSUTCDATETIME(),
                                 UpdatedByActorId = @UpdatedByActorId
                             WHERE TenantId = @TenantId
                               AND ConnectionId = @ConnectionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        ConnectionId = connectionId,
                        Status = status.ToString(),
                        LastPolledUtc = lastPolledUtc,
                        UpdatedByActorId = updatedByActorId
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private async Task DeleteCoreAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        const string sql = """
                             DELETE FROM dbo.TenantGcpConnectionRecords
                             WHERE TenantId = @TenantId
                               AND ConnectionId = @ConnectionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, ConnectionId = connectionId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
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
