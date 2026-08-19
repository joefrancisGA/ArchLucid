namespace ArchLucid.Application.Marketing;

using ArchLucid.Core.Marketing;

/// <summary>Persists immutable first-touch attribution and emits coarse conversion metrics (TB-019).</summary>
public interface IMarketingAttributionService
{
    Task PersistFirstTouchIfPresentAsync(
        Guid tenantId,
        MarketingAttributionSnapshot? snapshot,
        CancellationToken cancellationToken);
}
