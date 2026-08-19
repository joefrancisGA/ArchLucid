using ArchLucid.Core.Marketing;

namespace ArchLucid.Persistence.Marketing;

public sealed class NoOpTenantMarketingAttributionRepository : ITenantMarketingAttributionRepository
{
    public Task<bool> TryInsertFirstTouchAsync(
        Guid tenantId,
        MarketingAttributionSnapshot snapshot,
        string coarseMedium,
        string coarsePlatform,
        CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = snapshot;
        _ = coarseMedium;
        _ = coarsePlatform;
        _ = cancellationToken;

        return Task.FromResult(false);
    }
}
