namespace ArchLucid.Core.Billing;

/// <summary>Read model for operator billing subscription status (any lifecycle state).</summary>
public sealed record BillingSubscriptionStatusSnapshot(
    string Provider,
    string TierCode,
    string Status,
    int SeatsPurchased,
    int WorkspacesPurchased,
    bool IsPaymentPastDue);
