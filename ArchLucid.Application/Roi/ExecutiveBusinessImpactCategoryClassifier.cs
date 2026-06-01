using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Maps finding categories into executive dashboard business-impact pillars (TB-105).
/// </summary>
public static class ExecutiveBusinessImpactCategoryClassifier
{
    /// <summary>Counts deduplicated active findings into named sponsor-facing pillars.</summary>
    public static ExecutiveBusinessImpactCategoryCounts Build(IEnumerable<ArchitectureFinding> dedupedFindings)
    {
        ArgumentNullException.ThrowIfNull(dedupedFindings);

        int security = 0;
        int compliance = 0;
        int reliability = 0;
        int cost = 0;
        int governance = 0;
        int other = 0;

        foreach (ArchitectureFinding finding in dedupedFindings)
        {
            string category = NormalizeCategory(finding.Category);
            string? pillar = ResolvePillar(category);

            switch (pillar)
            {
                case "Security":
                    security++;
                    break;

                case "Compliance":
                    compliance++;
                    break;

                case "Reliability":
                    reliability++;
                    break;

                case "Cost":
                    cost++;
                    break;

                case "Governance":
                    governance++;
                    break;

                default:
                    other++;
                    break;
            }
        }

        return new ExecutiveBusinessImpactCategoryCounts
        {
            SecurityThemeCount = security,
            ComplianceThemeCount = compliance,
            ReliabilityThemeCount = reliability,
            CostThemeCount = cost,
            GovernanceThemeCount = governance,
            OtherThemeCount = other,
            SecurityComplianceThemeCount = security + compliance,
        };
    }

    private static string? ResolvePillar(string category)
    {
        if (MatchesAny(category, ExecutiveBusinessImpactPillarMatchers.Security))
            return "Security";

        if (MatchesAny(category, ExecutiveBusinessImpactPillarMatchers.Compliance))
            return "Compliance";

        if (MatchesAny(category, ExecutiveBusinessImpactPillarMatchers.Reliability))
            return "Reliability";

        if (MatchesAny(category, ExecutiveBusinessImpactPillarMatchers.Cost))
            return "Cost";

        if (MatchesAny(category, ExecutiveBusinessImpactPillarMatchers.Governance))
            return "Governance";

        return null;
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
