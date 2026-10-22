using ArchLucid.Core.Comparison;

namespace ArchLucid.Host.Core.Ask;

/// <summary>Compact comparison delta for comparison-narrative LLM prompts (TB-224).</summary>
internal static class ComparisonNarrativeSummaryBuilder
{
    internal static ComparisonNarrativeSummary Build(ComparisonResult comparison)
    {
        ArgumentNullException.ThrowIfNull(comparison);

        List<CategoryChangeCount> categoryChanges =
        [
            new CategoryChangeCount("decisions", comparison.DecisionChanges.Count),
            new CategoryChangeCount("requirements", comparison.RequirementChanges.Count),
            new CategoryChangeCount("security", comparison.SecurityChanges.Count),
            new CategoryChangeCount("topology", comparison.TopologyChanges.Count),
            new CategoryChangeCount("cost", comparison.CostChanges.Count),
        ];

        List<CategoryChangeCount> topCategories = categoryChanges
            .Where(static row => row.ChangeCount > 0)
            .OrderByDescending(static row => row.ChangeCount)
            .Take(3)
            .ToList();

        return new ComparisonNarrativeSummary
        {
            TotalDeltaCount = comparison.TotalDeltaCount,
            DecisionChanges = comparison.DecisionChanges.Count,
            RequirementChanges = comparison.RequirementChanges.Count,
            SecurityChanges = comparison.SecurityChanges.Count,
            TopologyChanges = comparison.TopologyChanges.Count,
            CostChanges = comparison.CostChanges.Count,
            TopCategoryChanges = topCategories,
            SummaryHighlights = comparison.SummaryHighlights.Take(5).ToList(),
        };
    }

    internal sealed class ComparisonNarrativeSummary
    {
        public int TotalDeltaCount
        {
            get;
            init;
        }

        public int DecisionChanges
        {
            get;
            init;
        }

        public int RequirementChanges
        {
            get;
            init;
        }

        public int SecurityChanges
        {
            get;
            init;
        }

        public int TopologyChanges
        {
            get;
            init;
        }

        public int CostChanges
        {
            get;
            init;
        }

        public IReadOnlyList<CategoryChangeCount> TopCategoryChanges
        {
            get;
            init;
        } = [];

        public IReadOnlyList<string> SummaryHighlights
        {
            get;
            init;
        } = [];
    }

    internal sealed record CategoryChangeCount(string Category, int ChangeCount);
}
