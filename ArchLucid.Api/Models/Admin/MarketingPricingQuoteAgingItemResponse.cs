namespace ArchLucid.Api.Models.Admin;

/// <summary>One row from <c>dbo.MarketingPricingQuoteRequestsAging</c>.</summary>
public sealed class MarketingPricingQuoteAgingItemResponse
{
    public Guid Id
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public double AgeHours
    {
        get;
        init;
    }

    public string BreachStatus
    {
        get;
        init;
    } = string.Empty;

    public string WorkEmail
    {
        get;
        init;
    } = string.Empty;

    public string CompanyName
    {
        get;
        init;
    } = string.Empty;

    public string TierInterest
    {
        get;
        init;
    } = string.Empty;

    public string Status
    {
        get;
        init;
    } = string.Empty;

    public DateTime? FirstResponseUtc
    {
        get;
        init;
    }

    public string? AssignedOwner
    {
        get;
        init;
    }
}
