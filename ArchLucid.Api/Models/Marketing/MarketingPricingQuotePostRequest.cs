namespace ArchLucid.Api.Models.Marketing;

/// <summary>Anonymous pricing quote request body.</summary>
public sealed class MarketingPricingQuotePostRequest
{
    public string WorkEmail { get; set; } = string.Empty;

    public string CompanyName { get; set; } = string.Empty;

    public string TierInterest { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    /// <summary>Honeypot — must stay empty for legitimate submissions.</summary>
    public string? WebsiteUrl { get; set; }
}
