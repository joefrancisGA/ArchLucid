using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

public sealed class NoOpWarmTenantCatalogStandbyRepository : IWarmTenantCatalogStandbyRepository
{
    public Task<int> CountUnclaimedAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(0);
    }

    public Task<WarmTenantCatalogStandbyRecord?> TryClaimOldestUnclaimedAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<WarmTenantCatalogStandbyRecord?>(null);
    }

    public Task InsertStandbyAsync(WarmTenantCatalogStandbyRecord record, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task MarkClaimedAsync(Guid standbyId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task ReleaseClaimAsync(Guid standbyId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }
}
