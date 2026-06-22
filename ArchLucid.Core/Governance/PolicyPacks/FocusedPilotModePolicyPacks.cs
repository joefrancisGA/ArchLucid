namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>
///     Focused pilot reviews limit effective governance to security baseline + FinOps cost packs only.
/// </summary>
public static class FocusedPilotModePolicyPacks
{
    /// <summary>Sent in <c>ArchitectureRequest.PolicyReferences</c> when focused pilot mode is enabled.</summary>
    public const string ReferenceToken = "pilot-mode:security-baseline-cost-only";

    /// <summary>Matches bundled platform pack display name for security baseline.</summary>
    public const string SecurityBaselineDisplayName = "Security Architecture Baseline";

    /// <summary>Matches bundled platform pack display name for FinOps cost optimization.</summary>
    public const string FinOpsCostOptimizationDisplayName = "FinOps & Cloud Cost Optimization";

    private static readonly HashSet<string> AllowedDisplayNames = new(StringComparer.Ordinal)
    {
        SecurityBaselineDisplayName,
        FinOpsCostOptimizationDisplayName,
    };

    /// <summary>Returns whether <paramref name="policyReferences" /> includes the focused pilot token.</summary>
    public static bool ReferencesIncludeFocusedPilotToken(IEnumerable<string>? policyReferences)
    {
        if (policyReferences is null)
            return false;

        foreach (string reference in policyReferences)
        {
            if (string.Equals(reference, ReferenceToken, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    /// <summary>Returns whether the pack display name is allowed during focused pilot mode.</summary>
    public static bool IsAllowedPackDisplayName(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            return false;

        return AllowedDisplayNames.Contains(displayName.Trim());
    }
}
