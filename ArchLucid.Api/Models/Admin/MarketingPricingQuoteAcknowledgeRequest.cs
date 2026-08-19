namespace ArchLucid.Api.Models.Admin;

/// <summary>Body for <c>POST /v1/admin/marketing/pricing-quote-requests/{id}/acknowledge</c>.</summary>
public sealed class MarketingPricingQuoteAcknowledgeRequest
{
    public string? AssignedOwner
    {
        get;
        init;
    }
}
