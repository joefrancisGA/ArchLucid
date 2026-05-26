using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

public sealed class NoOpWarmTenantCatalogStandbyRepository : IWarmTenantCatalogStandbyRepository
{
    public Task<int> CountUnclaimedAsync(CancellationToken cancellationToken) => Task.FromResult(0);

    public Task<WarmTenantCatalogStandbyRecord?> TryClaimOldestUnclaimedAsync(CancellationToken cancellationToken) =>
        Task.FromResult<WarmTenantCatalogStandbyRecord?>(null);

    public Task InsertStandbyAsync(WarmTenantCatalogStandbyRecord record, CancellationToken cancellationToken) =>
        Task.CompletedTask;

    public Task MarkClaimedAsync(Guid standbyId, CancellationToken cancellationToken) => Task.CompletedTask;
}
