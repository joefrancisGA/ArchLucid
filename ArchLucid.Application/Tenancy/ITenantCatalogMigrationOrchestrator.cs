namespace ArchLucid.Application.Tenancy;

public interface ITenantCatalogMigrationOrchestrator
{
    Task<(TenantCatalogMigrationCommandOutcome Outcome, Guid? MigrationId)> StartAsync(
        Guid tenantId,
        string correlationId,
        string actorUserId,
        string actorUserName,
        CancellationToken cancellationToken);

    Task<TenantCatalogMigrationCommandOutcome> AcknowledgeCatalogAttachDetachAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        CancellationToken cancellationToken);

    Task<(TenantCatalogMigrationCommandOutcome Outcome, TenantMigrationProjectionRefreshResult? Refresh)> RunProjectionRefreshAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string actorUserId,
        string actorUserName,
        CancellationToken cancellationToken);

    Task<(TenantCatalogMigrationCommandOutcome Outcome, TenantMigrationVerificationProbeResult? Probe)> RunVerificationAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        CancellationToken cancellationToken);

    Task<TenantCatalogMigrationCommandOutcome> CompleteAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        CancellationToken cancellationToken);
}
