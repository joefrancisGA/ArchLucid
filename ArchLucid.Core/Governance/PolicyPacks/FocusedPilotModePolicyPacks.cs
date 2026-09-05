namespace ArchLucid.Core.Governance.PolicyPacks;

using ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>
///     Focused first-review scope limits effective governance to the six provider-neutral
///     architecture-quality baseline packs (security, reliability, cost, performance, operations, sustainability).
/// </summary>
public static class FocusedPilotModePolicyPacks
{
    /// <summary>
    ///     Sent in <c>ArchitectureRequest.PolicyReferences</c> when focused review scope is enabled.
    ///     Token name is historical; allow-list is the six-dimension baseline.
    /// </summary>
    public const string ReferenceToken = "pilot-mode:security-baseline-cost-only";

    /// <summary>Matches bundled platform pack display name for security baseline.</summary>
    public const string SecurityBaselineDisplayName = "Security Architecture Baseline";

    /// <summary>Matches bundled platform pack display name for FinOps cost optimization.</summary>
    public const string FinOpsCostOptimizationDisplayName = "FinOps & Cloud Cost Optimization";

    /// <summary>Matches bundled platform pack display name for reliability baseline.</summary>
    public const string ReliabilityAndResilienceDisplayName = "Reliability and Resilience";

    /// <summary>Matches bundled platform pack display name for performance baseline.</summary>
    public const string PerformanceAndScalabilityDisplayName = "Performance and Scalability";

    /// <summary>Matches bundled platform pack display name for operational excellence baseline.</summary>
    public const string OperationalExcellenceDisplayName = "Operational Excellence";

    /// <summary>Matches bundled platform pack display name for environmental sustainability baseline.</summary>
    public const string SustainabilityAndResourceEfficiencyDisplayName = "Sustainability and Resource Efficiency";

    private static readonly HashSet<string> AllowedDisplayNames = new(StringComparer.OrdinalIgnoreCase)
    {
        SecurityBaselineDisplayName,
        ReliabilityAndResilienceDisplayName,
        FinOpsCostOptimizationDisplayName,
        PerformanceAndScalabilityDisplayName,
        OperationalExcellenceDisplayName,
        SustainabilityAndResourceEfficiencyDisplayName,
    };

    /// <summary>Canonical focused-scope pack display names in product order.</summary>
    public static IReadOnlyCollection<string> AllowedPackDisplayNames => AllowedDisplayNames;

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

    /// <summary>Returns whether the pack display name is one of the six provider-neutral baseline dimensions.</summary>
    public static bool IsAllowedPackDisplayName(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            return false;

        return AllowedDisplayNames.Contains(displayName.Trim());
    }

    /// <summary>
    ///     Focused first-review scope: six baseline dimensions plus organization-required packs and selected platform overlays.
    /// </summary>
    public static bool IsPackAllowedInFocusedReview(
        PolicyPack? pack,
        bool isOrganizationRequired,
        bool isPlatformOverlayForRunCloud)
    {
        if (isOrganizationRequired)
            return true;

        if (isPlatformOverlayForRunCloud)
            return true;

        string? slug = PolicyPackIdentity.ResolveSlug(pack);

        if (PolicyPackBundledSlugs.IsFocusedPilotBaselineSlug(slug))
            return true;

        return IsAllowedPackDisplayName(pack?.Name);
    }

    /// <summary>
    ///     Focused first-review scope: six baseline dimensions plus organization-required packs and selected platform overlays.
    /// </summary>
    public static bool IsPackAllowedInFocusedReview(
        string? displayName,
        bool isOrganizationRequired,
        bool isPlatformOverlayForRunCloud) =>
        IsPackAllowedInFocusedReview(
            displayName is null ? null : new PolicyPack { Name = displayName },
            isOrganizationRequired,
            isPlatformOverlayForRunCloud);
}
