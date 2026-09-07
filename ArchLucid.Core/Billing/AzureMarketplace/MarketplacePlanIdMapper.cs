using ArchLucid.Core.Tenancy;

namespace ArchLucid.Core.Billing.AzureMarketplace;

/// <summary>
///     Maps Azure Marketplace <c>planId</c> text to persisted <see cref="TenantTier" /> storage codes.
/// </summary>
public static class MarketplacePlanIdMapper
{
    /// <summary>
    ///     Maps Azure Marketplace <c>planId</c> text to persisted <see cref="TenantTier" /> storage codes (
    ///     <c>Standard</c> vs <c>Enterprise</c>).
    /// </summary>
    public static string TierStorageCodeFromPlanId(string? planId)
    {
        if (string.IsNullOrWhiteSpace(planId))
            return nameof(TenantTier.Standard);

        string p = planId.Trim();

        if (PlanIdContainsEnterpriseTierToken(p))
            return nameof(TenantTier.Enterprise);

        return nameof(TenantTier.Standard);
    }

    private static bool PlanIdContainsEnterpriseTierToken(string planId)
    {
        List<string> tokens = ExtractPlanIdTokens(planId);

        for (int i = 0; i < tokens.Count; i++)
        {
            if (!tokens[i].Equals("enterprise", StringComparison.OrdinalIgnoreCase))
                continue;

            string? previousToken = i > 0 ? tokens[i - 1] : null;
            string? nextToken = i + 1 < tokens.Count ? tokens[i + 1] : null;

            if (string.Equals(previousToken, "non", StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.Equals(nextToken, "non", StringComparison.OrdinalIgnoreCase))
                continue;

            return true;
        }

        return false;
    }

    private static List<string> ExtractPlanIdTokens(string planId)
    {
        List<string> tokens = new();
        int start = 0;

        for (int i = 0; i <= planId.Length; i++)
        {
            if (i != planId.Length && !IsPlanIdDelimiter(planId[i]))
                continue;

            ReadOnlySpan<char> token = planId.AsSpan(start, i - start);

            if (token.Length > 0)
                tokens.Add(token.ToString());

            start = i + 1;
        }

        return tokens;
    }

    private static bool IsPlanIdDelimiter(char value) =>
        value is '-' or '_' or ' ' or '.' or '/' or ':' or '\\' or '|';
}
