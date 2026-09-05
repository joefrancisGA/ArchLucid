using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Fail-closed when a required policy category had no successful engine invocation.
/// </summary>
public static class PolicyPackCategoryCoverageValidator
{
    public static IReadOnlyList<string> GetMissingCategoryViolations(
        FindingAnalysisContext context,
        IReadOnlyList<Finding> findings,
        IReadOnlySet<string> successfulEngineTypes)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(successfulEngineTypes);

        if (context.EnabledPolicyPackIds.Count == 0)
            return [];

        HashSet<string> requiredCategories = context.RequiredFindingCategories.Count > 0
            ? context.RequiredFindingCategories.ToHashSet(StringComparer.OrdinalIgnoreCase)
            : ResolveRequiredCategories(context);

        if (requiredCategories.Count == 0)
            return [];

        HashSet<string> coveredCategories = findings
            .Select(static finding => finding.Category)
            .Where(static category => !string.IsNullOrWhiteSpace(category))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string engineType in successfulEngineTypes)
        {
            if (engineType.Contains("security", StringComparison.OrdinalIgnoreCase))
                coveredCategories.Add("Security");

            if (engineType.Contains("cost", StringComparison.OrdinalIgnoreCase))
                coveredCategories.Add("Cost");

            if (engineType.Contains("requirement", StringComparison.OrdinalIgnoreCase))
                coveredCategories.Add("Requirement");

            if (engineType.Contains("topology", StringComparison.OrdinalIgnoreCase))
                coveredCategories.Add("Topology");

            if (engineType.Contains("policy", StringComparison.OrdinalIgnoreCase)
                || engineType.Contains("compliance", StringComparison.OrdinalIgnoreCase))
                coveredCategories.Add("Policy");
        }

        List<string> violations = [];

        foreach (string category in requiredCategories.OrderBy(static c => c, StringComparer.OrdinalIgnoreCase))
        {
            if (!coveredCategories.Contains(category))
            {
                violations.Add(
                    $"Policy theory-in-force requires {category} evaluation but no engine in that category succeeded.");
            }
        }

        return violations;
    }

    public static IReadOnlyList<string> GetMissingEngineTypeViolations(
        FindingAnalysisContext context,
        IReadOnlySet<string> successfulEngineTypes)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(successfulEngineTypes);

        if (context.RequiredEngineTypes.Count == 0)
            return [];

        List<string> violations = [];

        foreach (string requiredEngineType in context.RequiredEngineTypes.OrderBy(static type => type, StringComparer.OrdinalIgnoreCase))
        {
            if (!successfulEngineTypes.Contains(requiredEngineType))
            {
                violations.Add(
                    $"Policy theory-in-force requires engine '{requiredEngineType}' to succeed but it did not.");
            }
        }

        return violations;
    }

    private static HashSet<string> ResolveRequiredCategories(FindingAnalysisContext context)
    {
        HashSet<string> categories = new(StringComparer.OrdinalIgnoreCase);

        foreach (string packId in context.EnabledPolicyPackIds)
        {
            if (packId.Contains("security", StringComparison.OrdinalIgnoreCase))
                categories.Add("Security");

            if (packId.Contains("cost", StringComparison.OrdinalIgnoreCase))
                categories.Add("Cost");
        }

        return categories;
    }
}
