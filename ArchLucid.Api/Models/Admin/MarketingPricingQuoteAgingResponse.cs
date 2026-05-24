namespace ArchLucid.Api.Models.Admin;

/// <summary>JSON for <c>GET /v1/admin/marketing/pricing-quote-aging</c>.</summary>
public sealed class MarketingPricingQuoteAgingResponse
{
    public IReadOnlyList<MarketingPricingQuoteAgingItemResponse> Rows
    {
        get;
        init;
    } = [];

    public int WarnCount
    {
        get;
        init;
    }

    public int BreachCount
    {
        get;
        init;
    }
}
