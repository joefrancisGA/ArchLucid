using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.GcpExtractor;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.GcpExtractor;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via unit/API tests with in-memory repo.")]
public sealed partial class SqlTenantGcpConnectionRepository(
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
}
