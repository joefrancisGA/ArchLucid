namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>Curated rule coverage tiers (orthogonal to finding <see cref="Compliance.Models.ComplianceRule.Severity" />).</summary>
public static class PolicyPackRulePriority
{
    public const string P0 = "P0";

    public const string P1 = "P1";

    public const string P2 = "P2";

    /// <summary>Default when curated JSON omits <c>priority</c>.</summary>
    public const string Default = P1;

    public const string AdvisoryDefaultsKey = "priorityFloor";

    /// <summary>When <paramref name="advisoryDefaults" /> has no floor, include all tiers (backward compatible).</summary>
    public const string UnsetFloorIncludesAllTiers = P2;
}
