using ArchLucid.Contracts.Marketing;

namespace ArchLucid.Persistence.Marketing;

/// <summary>In-memory hosts: no SQL aging view; returns an empty snapshot.</summary>
public sealed class NoOpMarketingPricingQuoteRequestAgingReader : IMarketingPricingQuoteRequestAgingReader
{
    /// <inheritdoc />
    public Task<IReadOnlyList<MarketingPricingQuoteRequestAgingRow>> ListAsync(CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<MarketingPricingQuoteRequestAgingRow>>([]);
}
