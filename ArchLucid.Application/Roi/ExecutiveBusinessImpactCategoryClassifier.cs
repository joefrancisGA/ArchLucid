using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Maps finding categories into executive dashboard business-impact buckets (TB-105).
/// </summary>
public static class ExecutiveBusinessImpactCategoryClassifier
{
    private static readonly string[] SecurityComplianceMatchers = ["security", "compliance", "privacy"];

    private static readonly string[] ReliabilityMatchers = ["reliability", "availability", "resilience"];

    /// <summary>Counts deduplicated active findings into the two sponsor-facing theme buckets.</summary>
    public static ExecutiveBusinessImpactCategoryCounts Build(IEnumerable<ArchitectureFinding> dedupedFindings)
    {
        ArgumentNullException.ThrowIfNull(dedupedFindings);

        int securityCompliance = 0;
        int reliability = 0;

        foreach (ArchitectureFinding finding in dedupedFindings)
        {
            string category = NormalizeCategory(finding.Category);

            if (MatchesAny(category, SecurityComplianceMatchers))
            {
                securityCompliance++;
                continue;
            }

            if (MatchesAny(category, ReliabilityMatchers))
                reliability++;
        }

        return new ExecutiveBusinessImpactCategoryCounts
        {
            SecurityComplianceThemeCount = securityCompliance,
            ReliabilityThemeCount = reliability,
        };
    }

    private static bool MatchesAny(string category, IReadOnlyList<string> matchers)
    {
        foreach (string matcher in matchers)
        {
            if (category.Contains(matcher, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static string NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return "(uncategorized)";

        return category.Trim();
    }
}
