using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Maps enabled policy pack identifiers to required finding categories for theory-in-force coverage (wave-3 #26).
/// </summary>
public static class PolicyPackRequiredFindingCategoryResolver
{
    public static IReadOnlyList<string> ResolveRequiredCategories(IReadOnlyList<string> enabledPolicyPackIds)
    {
        if (enabledPolicyPackIds.Count == 0)
            return [];

        HashSet<string> categories = new(StringComparer.OrdinalIgnoreCase);

        foreach (string packId in enabledPolicyPackIds)
        {
            if (string.IsNullOrWhiteSpace(packId))
                continue;

            if (packId.Contains("security", StringComparison.OrdinalIgnoreCase))
                categories.Add("Security");

            if (packId.Contains("cost", StringComparison.OrdinalIgnoreCase))
                categories.Add("Cost");

            if (packId.Contains("requirement", StringComparison.OrdinalIgnoreCase))
                categories.Add("Requirement");

            if (packId.Contains("policy", StringComparison.OrdinalIgnoreCase)
                || packId.Contains("compliance", StringComparison.OrdinalIgnoreCase))
            {
                categories.Add("Policy");
            }
        }

        return categories.OrderBy(static category => category, StringComparer.OrdinalIgnoreCase).ToArray();
    }
}
