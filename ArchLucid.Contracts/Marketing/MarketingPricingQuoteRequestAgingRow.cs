namespace ArchLucid.Contracts.Marketing;

/// <summary>Row from <c>dbo.MarketingPricingQuoteRequestsAging</c> for sales SLA monitoring.</summary>
public readonly record struct MarketingPricingQuoteRequestAgingRow(
    Guid Id,
    string WorkEmail,
    string CompanyName,
    string TierInterest,
    DateTime CreatedUtc,
    double AgeHours,
    string BreachStatus);
