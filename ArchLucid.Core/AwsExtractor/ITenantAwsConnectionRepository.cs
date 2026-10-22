namespace ArchLucid.Core.AwsExtractor;

public interface ITenantAwsConnectionRepository
{
    Task<TenantAwsConnectionRecord?> TryGetAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken);

    Task<TenantAwsConnectionRecord?> TryGetByAccountAsync(
        Guid tenantId,
        string accountId,
        CancellationToken cancellationToken);

    Task UpsertAsync(TenantAwsConnectionRecord record, CancellationToken cancellationToken);

    Task UpdateStatusAsync(
        Guid tenantId,
        Guid connectionId,
        AwsConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken);

    Task DeleteAsync(Guid tenantId, Guid connectionId, CancellationToken cancellationToken);

    Task<IReadOnlyList<TenantAwsConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TenantAwsConnectionRecord>> ListActiveConnectionsAsync(
        CancellationToken cancellationToken);
}
