namespace ArchLucid.Core.Marketing;

/// <summary>Immutable first-touch attribution rows (TB-019).</summary>
public interface ITenantMarketingAttributionRepository
{
    Task<bool> TryInsertFirstTouchAsync(
        Guid tenantId,
        MarketingAttributionSnapshot snapshot,
        string coarseMedium,
        string coarsePlatform,
        CancellationToken cancellationToken);
}
