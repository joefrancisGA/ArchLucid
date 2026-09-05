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
        int start = 0;
        string? previousToken = null;

        for (int i = 0; i <= planId.Length; i++)
        {
            if (i != planId.Length && !IsPlanIdDelimiter(planId[i]))
                continue;

            ReadOnlySpan<char> token = planId.AsSpan(start, i - start);

            if (token.Equals("enterprise", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(previousToken, "non", StringComparison.OrdinalIgnoreCase))
                return true;

            previousToken = token.Length == 0 ? previousToken : token.ToString();
            start = i + 1;
        }

        return false;
    }

    private static bool IsPlanIdDelimiter(char value) =>
        value is '-' or '_' or ' ' or '.' or '/' or ':' or '\\' or '|';
}
