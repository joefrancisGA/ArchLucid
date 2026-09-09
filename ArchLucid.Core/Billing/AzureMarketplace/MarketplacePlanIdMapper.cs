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

            if (IsEnterpriseNegationToken(previousToken))
                continue;

            if (IsEnterpriseNegationToken(nextToken))
                continue;

            return true;
        }

        return false;
    }

    private static bool IsEnterpriseNegationToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return false;

        // Marketplace partners prefix enterprise tier tokens with negation adverbs
        // (exclude/excluding/excluded share the same stem).
        if (token.StartsWith("exclud", StringComparison.OrdinalIgnoreCase))
            return true;

        return token.Equals("non", StringComparison.OrdinalIgnoreCase)
               || token.Equals("not", StringComparison.OrdinalIgnoreCase)
               || token.Equals("no", StringComparison.OrdinalIgnoreCase)
               || token.Equals("never", StringComparison.OrdinalIgnoreCase)
               || token.Equals("anti", StringComparison.OrdinalIgnoreCase)
               || token.Equals("without", StringComparison.OrdinalIgnoreCase)
               || token.Equals("sans", StringComparison.OrdinalIgnoreCase)
               || token.Equals("minus", StringComparison.OrdinalIgnoreCase)
               || token.Equals("un", StringComparison.OrdinalIgnoreCase)
               || token.Equals("de", StringComparison.OrdinalIgnoreCase)
               || token.Equals("ex", StringComparison.OrdinalIgnoreCase)
               || token.Equals("pseudo", StringComparison.OrdinalIgnoreCase)
               || token.Equals("semi", StringComparison.OrdinalIgnoreCase)
               || token.Equals("sub", StringComparison.OrdinalIgnoreCase)
               || token.Equals("micro", StringComparison.OrdinalIgnoreCase)
               || token.Equals("less", StringComparison.OrdinalIgnoreCase)
               || token.Equals("lacking", StringComparison.OrdinalIgnoreCase)
               || token.Equals("omit", StringComparison.OrdinalIgnoreCase)
               || token.Equals("outside", StringComparison.OrdinalIgnoreCase)
               || token.Equals("except", StringComparison.OrdinalIgnoreCase);
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
