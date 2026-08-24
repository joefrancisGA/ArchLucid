namespace ArchLucid.Persistence.Billing;

/// <summary>
///     Shared rules for when a billing webhook ledger row should block a concurrent or duplicate delivery.
/// </summary>
internal static class BillingWebhookLedgerReplayPolicy
{
    internal static bool ShouldRejectDuplicateLedgerEntry(string? priorStatus) =>
        !string.IsNullOrWhiteSpace(priorStatus)
        && !string.Equals(priorStatus, "Failed", StringComparison.OrdinalIgnoreCase);
}
