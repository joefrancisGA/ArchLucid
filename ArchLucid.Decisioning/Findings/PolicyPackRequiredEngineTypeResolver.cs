using ArchLucid.Contracts.Governance;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Wave-4 suggestion 33: derives required engine types from pack content (not pack-id substring heuristics).
/// </summary>
public static class PolicyPackRequiredEngineTypeResolver
{
    public static IReadOnlyList<string> ResolveRequiredEngineTypes(IReadOnlyList<PolicyPackContentDocument> enabledPackContents)
    {
        if (enabledPackContents.Count == 0)
            return [];

        HashSet<string> engineTypes = new(StringComparer.OrdinalIgnoreCase);

        foreach (PolicyPackContentDocument content in enabledPackContents)
        {
            foreach (string engineType in content.RequiredEngineTypes)
            {
                if (!string.IsNullOrWhiteSpace(engineType))
                    engineTypes.Add(engineType.Trim());
            }

            if (content.RequiredEngineTypes.Count > 0)
                continue;

            string? category = content.Metadata.GetValueOrDefault("pack.category");

            if (string.IsNullOrWhiteSpace(category))
                continue;

            foreach (string derived in DeriveDefaultEngineTypesForCategory(category))
                engineTypes.Add(derived);
        }

        return engineTypes.OrderBy(static type => type, StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private static IEnumerable<string> DeriveDefaultEngineTypesForCategory(string category)
    {
        if (category.Contains("security", StringComparison.OrdinalIgnoreCase))
        {
            yield return "security-baseline";
            yield return "security-coverage";
            yield return "declaration-security-baseline";
        }

        if (category.Contains("cost", StringComparison.OrdinalIgnoreCase))
        {
            yield return "cost-constraint";
            yield return "cost-breach";
            yield return "advisor-cost-recommendation";
        }

        if (category.Contains("requirement", StringComparison.OrdinalIgnoreCase))
        {
            yield return "requirement";
            yield return "requirement-coverage";
        }

        if (category.Contains("policy", StringComparison.OrdinalIgnoreCase)
            || category.Contains("compliance", StringComparison.OrdinalIgnoreCase))
        {
            yield return "policy-coverage";
            yield return "compliance";
        }
    }
}
