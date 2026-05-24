namespace ArchLucid.Persistence.Roi;

public interface ITenantCostSettingsRepository
{
    Task<TenantCostSettingsRecord?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken);

    Task UpsertAsync(TenantCostSettingsRecord record, CancellationToken cancellationToken);
}
