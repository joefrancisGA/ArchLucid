namespace ArchLucid.Core.Findings;

/// <summary>
///     Category-aware demotion rules for agent architecture findings (TB-2228).
///     Typed <c>IFindingEngine</c> outputs are never demoted; only low-signal agent categories are eligible.
/// </summary>
internal static class InsightDensityAgentCategoryRules
{
    private static readonly HashSet<string> DemotionEligibleCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        string.Empty,
        "Insight",
        "General",
        "Critic",
    };

    internal static bool IsDemotionEligibleCategory(string? category)
    {
        string normalized = (category ?? string.Empty).Trim();

        return DemotionEligibleCategories.Contains(normalized);
    }
}
