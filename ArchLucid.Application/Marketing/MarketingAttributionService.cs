using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Marketing;

namespace ArchLucid.Application.Marketing;

public sealed class MarketingAttributionService(ITenantMarketingAttributionRepository repository)
    : IMarketingAttributionService
{
    private readonly ITenantMarketingAttributionRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public async Task PersistFirstTouchIfPresentAsync(
        Guid tenantId,
        MarketingAttributionSnapshot? snapshot,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty || snapshot is null || !HasAnyUtm(snapshot))
            return;

        string coarseMedium = MarketingAttributionBucketMapper.MapCoarseMedium(snapshot.UtmMedium);
        string coarsePlatform = MarketingAttributionBucketMapper.MapCoarsePlatform(snapshot.UtmSource);

        bool inserted = await _repository.TryInsertFirstTouchAsync(
            tenantId,
            snapshot,
            coarseMedium,
            coarsePlatform,
            cancellationToken).ConfigureAwait(false);

        if (!inserted)
            return;

        ArchLucidInstrumentation.RecordSignupMarketingConversion(coarseMedium, coarsePlatform);
    }

    private static bool HasAnyUtm(MarketingAttributionSnapshot snapshot)
    {
        return !string.IsNullOrWhiteSpace(snapshot.UtmSource)
               || !string.IsNullOrWhiteSpace(snapshot.UtmMedium)
               || !string.IsNullOrWhiteSpace(snapshot.UtmCampaign)
               || !string.IsNullOrWhiteSpace(snapshot.UtmContent);
    }
}
