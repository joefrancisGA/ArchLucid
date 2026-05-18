using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>Resolves <c>priorityFloor</c> from merged <see cref="PolicyPackContentDocument.AdvisoryDefaults" /> and filters rules.</summary>
public static class PolicyPackPriorityFloor
{
    /// <summary>Reads <see cref="PolicyPackRulePriority.AdvisoryDefaultsKey" /> or returns <see cref="PolicyPackRulePriority.UnsetFloorIncludesAllTiers" />.</summary>
    public static string ResolveFloor(PolicyPackContentDocument effective)
    {
        if (effective is null) throw new ArgumentNullException(nameof(effective));

        if (effective.AdvisoryDefaults.TryGetValue(PolicyPackRulePriority.AdvisoryDefaultsKey, out string? raw) &&
            !string.IsNullOrWhiteSpace(raw))
            return NormalizeTier(raw);

        return PolicyPackRulePriority.UnsetFloorIncludesAllTiers;
    }

    /// <summary>
    ///     Returns rules whose <see cref="ComplianceRule.Priority" /> is at or above the floor (P0 is strictest floor;
    ///     P2 floor includes P0, P1, and P2).
    /// </summary>
    public static IReadOnlyList<ComplianceRule> FilterRules(
        IEnumerable<ComplianceRule> rules,
        string priorityFloor)
    {
        if (rules is null) throw new ArgumentNullException(nameof(rules));

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
