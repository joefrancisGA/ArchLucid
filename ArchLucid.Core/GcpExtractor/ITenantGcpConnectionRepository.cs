namespace ArchLucid.Core.GcpExtractor;

public interface ITenantGcpConnectionRepository
{
    Task<TenantGcpConnectionRecord?> TryGetAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken);

    Task<TenantGcpConnectionRecord?> TryGetByProjectAsync(
        Guid tenantId,
        string projectId,
        CancellationToken cancellationToken);

    Task UpsertAsync(TenantGcpConnectionRecord record, CancellationToken cancellationToken);

    Task UpdateStatusAsync(
        Guid tenantId,
        Guid connectionId,
        GcpConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken);

    Task DeleteAsync(Guid tenantId, Guid connectionId, CancellationToken cancellationToken);

    Task<IReadOnlyList<TenantGcpConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TenantGcpConnectionRecord>> ListActiveConnectionsAsync(
        CancellationToken cancellationToken);
}
