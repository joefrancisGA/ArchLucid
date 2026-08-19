namespace ArchLucid.Application.Tenancy;

public interface ITenantMigrationProjectionRefreshService
{
    Task<TenantMigrationProjectionRefreshResult> RefreshAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken);
}
