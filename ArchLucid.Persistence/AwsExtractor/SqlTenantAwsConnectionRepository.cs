using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.AwsExtractor;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.AwsExtractor;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via unit/API tests with in-memory repo.")]
public sealed partial class SqlTenantAwsConnectionRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantAwsConnectionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantAwsConnectionRecord?> TryGetAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => TryGetCoreAsync(tenantId, connectionId, ct),
            cancellationToken);

    public Task<TenantAwsConnectionRecord?> TryGetByAccountAsync(
        Guid tenantId,
        string accountId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => TryGetByAccountCoreAsync(tenantId, accountId, ct),
            cancellationToken);

    public Task UpsertAsync(TenantAwsConnectionRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => UpsertCoreAsync(record, ct), cancellationToken);

    public Task UpdateStatusAsync(
        Guid tenantId,
        Guid connectionId,
        AwsConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => UpdateStatusCoreAsync(tenantId, connectionId, status, lastPolledUtc, updatedByActorId, ct),
            cancellationToken);

    public Task DeleteAsync(Guid tenantId, Guid connectionId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => DeleteCoreAsync(tenantId, connectionId, ct), cancellationToken);

    public Task<IReadOnlyList<TenantAwsConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListByTenantCoreAsync(tenantId, ct), cancellationToken);

    public Task<IReadOnlyList<TenantAwsConnectionRecord>> ListActiveConnectionsAsync(
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListActiveConnectionsCoreAsync(ct), cancellationToken);
}
