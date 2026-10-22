namespace ArchLucid.Contracts.Marketing;

/// <summary>Row from <c>dbo.MarketingPricingQuoteRequestsAging</c> for sales SLA monitoring.</summary>
public readonly record struct MarketingPricingQuoteRequestAgingRow(
    Guid Id,
    string WorkEmail,
    string CompanyName,
    string TierInterest,
    DateTime CreatedUtc,
    string Status,
    DateTime? FirstResponseUtc,
    string? AssignedOwner,
    double AgeHours,
    string BreachStatus);
