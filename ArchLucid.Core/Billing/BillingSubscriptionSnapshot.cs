namespace ArchLucid.Core.Billing;

/// <summary>Read model for an active or pending billing subscription row.</summary>
public sealed record BillingSubscriptionSnapshot(
    string Provider,
    string TierCode,
    int SeatsPurchased,
    int WorkspacesPurchased,
    string Status);
