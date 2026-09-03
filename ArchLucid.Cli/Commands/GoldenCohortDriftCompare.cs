using ArchLucid.Contracts.Agents;
using ArchLucid.Core.GoldenCorpus;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     SHA-256 manifest and finding-category comparisons for golden-cohort drift.
/// </summary>
internal static class GoldenCohortDriftCompare
{
    internal static bool TryCompareCommittedSha(
        GoldenCohortItem item,
        string actualShaHexUpper,
        out string? error)
    {
        string actualShaLower = actualShaHexUpper.ToLowerInvariant();
        string expectedSha = item.ExpectedCommittedManifestSha256.Trim();

        if (string.Equals(actualShaLower, expectedSha, StringComparison.OrdinalIgnoreCase))
        {
            error = null;

            return true;
        }

        error =
            $"[{item.Id}] committed manifest SHA mismatch. expected={expectedSha} actual={actualShaLower}";

        return false;
    }

    internal static bool CategoriesMatch(GoldenCohortItem item, List<AgentResult> agentResults)
    {
        SortedSet<string> actualCategories = GoldenCohortFindingCategoryAggregator.DistinctCategories(agentResults);
        SortedSet<string> expectedCategories = new(StringComparer.Ordinal);

        foreach (string c in item.ExpectedFindingCategories.Where(c => !string.IsNullOrWhiteSpace(c)))
            expectedCategories.Add(c.Trim());

        return actualCategories.SetEquals(expectedCategories);
    }

    internal static string FormatCategoryMismatch(
        GoldenCohortItem item,
        List<AgentResult> agentResults)
    {
        SortedSet<string> actualCategories =
            GoldenCohortFindingCategoryAggregator.DistinctCategories(agentResults);
        SortedSet<string> expectedCategories = new(StringComparer.Ordinal);

        foreach (string c in item.ExpectedFindingCategories.Where(c => !string.IsNullOrWhiteSpace(c)))
            expectedCategories.Add(c.Trim());

        return
            $"[{item.Id}] finding category multiset mismatch. expected={string.Join(", ", expectedCategories)} " +
            $"actual={string.Join(", ", actualCategories)}";
    }
}
