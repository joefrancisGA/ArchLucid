using System.Globalization;

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

        string trimmed = tier.Trim();

        if (trimmed.Equals(PolicyPackRulePriority.P0, StringComparison.OrdinalIgnoreCase))
            return PolicyPackRulePriority.P0;

        if (trimmed.Equals(PolicyPackRulePriority.P2, StringComparison.OrdinalIgnoreCase))
            return PolicyPackRulePriority.P2;

        if (trimmed.Equals(PolicyPackRulePriority.P1, StringComparison.OrdinalIgnoreCase))
            return PolicyPackRulePriority.P1;

        if (TryParseBooleanOrdinalString(trimmed, out int booleanOrdinal))
            return MapOrdinalToTier(booleanOrdinal);

        if (TryParseWholeNumberString(trimmed, out int wholeNumber))
            return MapOrdinalToTier(wholeNumber);

        return PolicyPackRulePriority.P1;
    }

    private static string MapOrdinalToTier(int ordinal) =>
        ordinal switch
        {
            0 => PolicyPackRulePriority.P0,
            2 => PolicyPackRulePriority.P2,
            _ => PolicyPackRulePriority.P1,
        };

    private static bool TryParseBooleanOrdinalString(string raw, out int ordinal)
    {
        if (TryParseBooleanString(raw, out bool boolean))
        {
            ordinal = boolean ? 1 : 0;

            return true;
        }

        ordinal = default;

        return false;
    }

    private static bool TryParseBooleanString(string? raw, out bool value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string normalized = raw.Trim();

        if (normalized.Equals("true", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("1", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("on", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (normalized.Equals("false", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("0", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("no", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("off", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string raw, out int value)
    {
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static int TierRank(string tier) =>
        tier switch
        {
            PolicyPackRulePriority.P0 => 0,
            PolicyPackRulePriority.P2 => 2,
            _ => 1,
        };
}
