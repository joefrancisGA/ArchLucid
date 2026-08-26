namespace ArchLucid.Integrations.AzureExtractor;

internal static class HostedAzureArmNextLinkValidator
{
    private const string SubscriptionsPathPrefix = "/subscriptions/";

    public static void EnsureTargetsSubscription(string nextLink, string subscriptionId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        if (!Uri.TryCreate(nextLink, UriKind.Absolute, out Uri? uri))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM resource listing due to an invalid nextLink.");
        }

        string normalizedSubscriptionId = subscriptionId.Trim();
        string? nextLinkSubscriptionId = TryGetSubscriptionId(uri.AbsolutePath);

        if (nextLinkSubscriptionId is null ||
            !string.Equals(nextLinkSubscriptionId, normalizedSubscriptionId, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM resource listing because nextLink targets a different subscription.");
        }
    }

    private static string? TryGetSubscriptionId(string absolutePath)
    {
        if (!absolutePath.StartsWith(SubscriptionsPathPrefix, StringComparison.OrdinalIgnoreCase))
            return null;

        ReadOnlySpan<char> remainder = absolutePath.AsSpan(SubscriptionsPathPrefix.Length);
        int slashIndex = remainder.IndexOf('/');

        ReadOnlySpan<char> subscriptionId = slashIndex < 0
            ? remainder
            : remainder[..slashIndex];

        if (subscriptionId.IsEmpty)
            return null;

        return subscriptionId.ToString();
    }
}
