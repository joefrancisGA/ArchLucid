namespace ArchLucid.Application.Billing;

public interface IBillingCheckoutFacade
{
    Task<BillingCheckoutSessionResult> CreateCheckoutSessionAsync(BillingCheckoutPostBody body, string actorUserName, CancellationToken cancellationToken = default);
    Task<BillingPortalSessionResult> CreatePortalSessionAsync(BillingPortalPostBody body, string actorUserName, CancellationToken cancellationToken = default);
    Task<BillingSubscriptionStatusQueryResult> GetSubscriptionStatusAsync(CancellationToken cancellationToken = default);
    Task<MarketplaceWebhookTestResult> TestMarketplaceWebhookAsync(string actorUserName, CancellationToken cancellationToken = default);
}

public sealed class BillingCheckoutPostBody
{
    public string? ReturnUrl { get; init; }
    public string? CancelUrl { get; init; }
    public string? TargetTier { get; init; }
    public int? Seats { get; init; }
    public int? Workspaces { get; init; }
    public string? BillingEmail { get; init; }
}

public sealed class BillingPortalPostBody
{
    public string? ReturnUrl { get; init; }
}
