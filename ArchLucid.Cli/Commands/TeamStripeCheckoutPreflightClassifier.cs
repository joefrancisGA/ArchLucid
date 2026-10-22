namespace ArchLucid.Cli.Commands;

/// <summary>Classifies public Team Stripe checkout URLs for marketplace preflight (no network calls).</summary>
public static class TeamStripeCheckoutPreflightClassifier
{
    public const string Placeholder = "PLACEHOLDER";

    public const string TestMode = "TEST_MODE";

    public const string LiveCandidate = "LIVE_CANDIDATE";

    public const string NotConfigured = "NOT_CONFIGURED";

    public static string Classify(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl))
            return NotConfigured;

        string url = rawUrl.Trim();
        string lower = url.ToLowerInvariant();

        if (lower.Contains("placeholder-replace-before-launch", StringComparison.Ordinal)
            || lower.Contains("checkout-placeholder", StringComparison.Ordinal))
        {
            return Placeholder;
        }

        if (lower.Contains("cs_test_", StringComparison.Ordinal))
            return TestMode;

        if (lower.Contains("buy.stripe.com/test_", StringComparison.Ordinal))
            return TestMode;

        if (lower.StartsWith("https://buy.stripe.com/", StringComparison.OrdinalIgnoreCase)
            || lower.StartsWith("https://checkout.stripe.com/", StringComparison.OrdinalIgnoreCase))
        {
            return LiveCandidate;
        }

        return NotConfigured;
    }
}
