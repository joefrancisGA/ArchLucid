namespace ArchLucid.Core.Findings;

/// <summary>
///     Rule-id prefixes for bundled platform default policy packs (toggleable baseline guidance).
/// </summary>
public static class StandardBaselinePolicyRuleIdPrefixes
{
    private static readonly string[] Prefixes =
    [
        "waf-az-",
        "waf-aws-",
        "waf-gcp-",
        "sec-base-",
        "rel-base-",
        "perf-base-",
        "ops-base-",
        "sust-base-",
        "cost-opt-",
        "ai-gov-",
        "cis-az-",
        "cis-aws-",
        "cis-gcp-",
        "iam-aws-",
        "iam-gcp-",
        "lz-aws-",
        "lz-gcp-",
        "zta-",
        "finops-",
    ];

    /// <summary>Returns true when <paramref name="policyRuleId" /> belongs to a standard baseline pack.</summary>
    public static bool IsStandardBaseline(string? policyRuleId)
    {
        if (string.IsNullOrWhiteSpace(policyRuleId))
            return false;

        string normalized = policyRuleId.Trim();

        foreach (string prefix in Prefixes)
        {
            if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
