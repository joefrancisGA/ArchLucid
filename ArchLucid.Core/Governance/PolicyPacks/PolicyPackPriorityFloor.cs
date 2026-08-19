using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Core.Governance.PolicyPacks;

public static class PolicyPackPriorityFloor
{
    public static string ResolveFloor(PolicyPackContentDocument effective)
    {
        ArgumentNullException.ThrowIfNull(effective);

        if (effective.AdvisoryDefaults.TryGetValue(PolicyPackRulePriority.AdvisoryDefaultsKey, out string? raw) &&
            !string.IsNullOrWhiteSpace(raw))
            return NormalizeTier(raw);

        return PolicyPackRulePriority.UnsetFloorIncludesAllTiers;
    }

    public static IReadOnlyList<ComplianceRule> FilterRules(
        IEnumerable<ComplianceRule> rules,
        string priorityFloor)
    {
        ArgumentNullException.ThrowIfNull(rules);

        string floor = NormalizeTier(priorityFloor);
        int floorRank = TierRank(floor);

        return rules.Where(r => TierRank(NormalizeTier(r.Priority)) <= floorRank).ToList();
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

    private static int TierRank(string tier) =>
        tier switch
        {
            PolicyPackRulePriority.P0 => 0,
            PolicyPackRulePriority.P2 => 2,
            _ => 1,
        };
}
