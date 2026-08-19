namespace ArchLucid.Contracts.Marketing;

/// <summary>Derived SLA states for unanswered marketing pricing quote requests.</summary>
public static class MarketingPricingQuoteRequestBreachStatus
{
    public const string Ok = "ok";

    public const string WarnAt18Hours = "warn at 18h";

    public const string BreachAt24Hours = "breach at 24h";
}
