using ArchLucid.Application.Integrations;
using ArchLucid.Core.Billing;

namespace ArchLucid.Application.Billing;

public enum BillingCheckoutValidationOutcome { Success, RequestBodyRequired, ActiveSubscriptionConflict, ProviderError }

public sealed record BillingCheckoutSessionResult
{
    public required BillingCheckoutValidationOutcome Outcome { get; init; }
    public BillingCheckoutResult? Checkout { get; init; }
    public string? ErrorMessage { get; init; }
}

public sealed record BillingPortalSessionResult
{
    public required BillingCheckoutValidationOutcome Outcome { get; init; }
    public BillingPortalResult? Portal { get; init; }
    public string? ErrorMessage { get; init; }
}

public sealed record BillingSubscriptionStatusQueryResult
{
    public required bool HasSubscription { get; init; }
    public string? Provider { get; init; }
    public string? TierCode { get; init; }
    public string? Status { get; init; }
    public bool IsPaymentPastDue { get; init; }
}

public sealed record MarketplaceWebhookTestResult
{
    public required OutboundWebhookDryRunResult Outcome { get; init; }
}
