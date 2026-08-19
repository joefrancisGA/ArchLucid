namespace ArchLucid.Persistence.Tenancy;

/// <summary>Maintains warm tenant catalog standbys (TB-018).</summary>
public interface IWarmTenantCatalogReplenishService
{
    Task ReplenishAsync(CancellationToken cancellationToken);
}
