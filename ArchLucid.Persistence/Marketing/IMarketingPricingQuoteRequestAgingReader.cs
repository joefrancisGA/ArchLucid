using ArchLucid.Contracts.Marketing;

namespace ArchLucid.Persistence.Marketing;

/// <summary>Reads <c>dbo.MarketingPricingQuoteRequestsAging</c> for operator SLA dashboards.</summary>
public interface IMarketingPricingQuoteRequestAgingReader
{
    Task<IReadOnlyList<MarketingPricingQuoteRequestAgingRow>> ListAsync(CancellationToken cancellationToken);
}
