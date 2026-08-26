using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>
///     Maps declaration classifier themes to bundled curated-rule ids (cis-az-*, sec-base-*).
///     Used when the tenant's filtered compliance pack opts into this vocabulary.
/// </summary>
public static class DeclarationSignalPolicyKeyMap
{
    private static readonly IReadOnlyDictionary<string, HashSet<string>> ThemeToRuleIds =
        new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            ["data-protection"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "cis-az-006",
                "cis-az-009",
                "cis-az-012",
                "sec-base-028",
            },
            ["encryption"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "cis-az-012",
                "cis-az-025",
            },
            ["transport-security"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "cis-az-025",
            },
            ["network-isolation"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "cis-az-018",
                "cis-az-019",
            },
            ["workload-isolation"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "cis-az-027",
                "sec-base-028",
            },
        };

    private static readonly HashSet<string> AllMappedRuleIds = ThemeToRuleIds.Values
        .SelectMany(static set => set)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    /// <summary>All rule ids referenced by any theme map entry.</summary>
    public static IReadOnlySet<string> MappedRuleIds => AllMappedRuleIds;

    /// <summary>
    ///     Returns true when <paramref name="activeRuleIds" /> contains at least one mapped curated key.
    ///     workload-isolation maps to cis-az-027 (API server access) as the closest bundled CIS Kubernetes control.
    /// </summary>
    public static bool TenantUsesDeclarationVocabulary(IReadOnlySet<string> activeRuleIds)
    {
        ArgumentNullException.ThrowIfNull(activeRuleIds);

        foreach (string ruleId in activeRuleIds)
        {
            if (AllMappedRuleIds.Contains(ruleId))
                return true;
        }

        return false;
    }

    public static bool IsThemeEnabled(string theme, IReadOnlySet<string> activeRuleIds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(theme);
        ArgumentNullException.ThrowIfNull(activeRuleIds);

        if (!ThemeToRuleIds.TryGetValue(theme, out HashSet<string>? mappedKeys))
            return false;

        foreach (string ruleId in activeRuleIds)
        {
            if (mappedKeys.Contains(ruleId))
                return true;
        }

        return false;
    }

    public static string? TryGetFirstMappedRuleId(string theme, IReadOnlySet<string> activeRuleIds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(theme);
        ArgumentNullException.ThrowIfNull(activeRuleIds);

        if (!ThemeToRuleIds.TryGetValue(theme, out HashSet<string>? mappedKeys))
            return null;

        foreach (string ruleId in activeRuleIds)
        {
            if (mappedKeys.Contains(ruleId))
                return ruleId;
        }

        return null;
    }

    public static HashSet<string> CollectActiveRuleIds(ComplianceRulePack rulePack)
    {
        ArgumentNullException.ThrowIfNull(rulePack);

        return rulePack.Rules
            .Where(static rule => !string.IsNullOrWhiteSpace(rule.RuleId))
            .Select(static rule => rule.RuleId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
