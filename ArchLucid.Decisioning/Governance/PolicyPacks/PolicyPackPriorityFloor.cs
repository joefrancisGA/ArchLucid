using ArchLucid.Contracts.Compliance;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>Compatibility shim; canonical implementation is <see cref="ArchLucid.Core.Governance.PolicyPacks.PolicyPackPriorityFloor" />.</summary>
public static class PolicyPackPriorityFloor
{
    public static string ResolveFloor(PolicyPackContentDocument effective)
    {
        return ArchLucid.Core.Governance.PolicyPacks.PolicyPackPriorityFloor.ResolveFloor(effective);
    }

    public static IReadOnlyList<ComplianceRule> FilterRules(
        IEnumerable<ComplianceRule> rules,
        string priorityFloor)
    {
        return ArchLucid.Core.Governance.PolicyPacks.PolicyPackPriorityFloor.FilterRules(rules, priorityFloor);
    }

    internal static string NormalizeTier(string? tier)
    {
        if (string.IsNullOrWhiteSpace(tier))
            return PolicyPackRulePriority.Default;

        string t = tier.Trim().ToUpperInvariant();

        if (t is "P0" or "0")
            return PolicyPackRulePriority.P0;

        if (t is "P2" or "2")
            return PolicyPackRulePriority.P2;

        return PolicyPackRulePriority.P1;
    }
}
