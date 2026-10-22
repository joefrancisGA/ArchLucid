namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Resolves buyer-facing Azure subscription identity for inventory snapshot headers.
/// </summary>
public static class AzureInventorySnapshotSubscriptionIdentity
{
    public static (string? SubscriptionId, string? SubscriptionName) Resolve(
        string? headerSubscriptionId,
        string? headerSubscriptionName,
        string? manifestSubscriptionId,
        string? manifestSubscriptionName,
        string? siblingSubscriptionName)
    {
        string? subscriptionId = FirstNonEmpty(headerSubscriptionId, manifestSubscriptionId);

        string? subscriptionName =
            AzureExtractorSubscriptionDisplayName.Normalize(headerSubscriptionName)
            ?? AzureExtractorSubscriptionDisplayName.Normalize(manifestSubscriptionName)
            ?? AzureExtractorSubscriptionDisplayName.Normalize(siblingSubscriptionName);

        return (subscriptionId, subscriptionName);
    }

    private static string? FirstNonEmpty(string? primary, string? secondary)
    {
        if (!string.IsNullOrWhiteSpace(primary))
            return primary.Trim();

        if (!string.IsNullOrWhiteSpace(secondary))
            return secondary.Trim();

        return null;
    }
}
