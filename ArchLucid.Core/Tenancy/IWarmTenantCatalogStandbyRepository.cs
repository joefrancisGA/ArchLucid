namespace ArchLucid.Core.Tenancy;

public interface IWarmTenantCatalogStandbyRepository
{
    Task<int> CountUnclaimedAsync(CancellationToken cancellationToken);

    Task<WarmTenantCatalogStandbyRecord?> TryClaimOldestUnclaimedAsync(CancellationToken cancellationToken);

    Task InsertStandbyAsync(WarmTenantCatalogStandbyRecord record, CancellationToken cancellationToken);

    Task MarkClaimedAsync(Guid standbyId, CancellationToken cancellationToken);
}
