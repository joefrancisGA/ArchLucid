using ArchLucid.Core.Comparison;

using Xunit;

namespace ArchLucid.Integrations.AzureDevOps.Tests;
[Trait("Category", "Unit")]

public sealed class GoldenManifestCompareMarkdownFormatterTests
{
    [Fact]
    public void Format_throws_when_result_is_null()
    {
        ArgumentNullException ex =
            Assert.Throws<ArgumentNullException>(() => GoldenManifestCompareMarkdownFormatter.Format(null!, null));
        Assert.Equal("result", ex.ParamName);
    }

    [Fact]
    public void Format_emits_delta_bucket_counts_truncates_highlight_list_to_twenty_and_trims_deep_link()
    {
        Guid baseRun = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid targetRun = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ComparisonResult result = new()
        {
            BaseRunId = baseRun,
            TargetRunId = targetRun,
            TotalDeltaCount = 99,
            SummaryHighlights =
            [
                .. Enumerable.Range(0, 21).Select(n => $"line-{n:D2}")
            ],
            DecisionChanges = [new DecisionDelta { DecisionKey = "a", ChangeType = "Modified" }],
            RequirementChanges =
            [
                new RequirementDelta { RequirementName = "r1", ChangeType = "Changed" },
                new RequirementDelta { RequirementName = "r2", ChangeType = "Changed" },
            ],
            SecurityChanges = [],
            TopologyChanges = [new TopologyDelta { Resource = "x", ChangeType = "Added" }],
            CostChanges =
            [
                new CostDelta { BaseCost = 1m, TargetCost = 2m },
            ],
        };

        string md = GoldenManifestCompareMarkdownFormatter.Format(result, "  https://ops.example/app/ ");

        Assert.Contains("## ArchLucid manifest delta", md, StringComparison.Ordinal);
        Assert.Contains($"**Base run:** `{baseRun:D}`", md, StringComparison.Ordinal);
        Assert.Contains("| Decision changes | 1 |", md, StringComparison.Ordinal);
        Assert.Contains("| Requirement changes | 2 |", md, StringComparison.Ordinal);
        Assert.Contains("| Topology changes | 1 |", md, StringComparison.Ordinal);
        Assert.Contains("| Cost changes | 1 |", md, StringComparison.Ordinal);
        Assert.Contains("- line-19", md, StringComparison.Ordinal);
        Assert.DoesNotContain("- line-20", md, StringComparison.Ordinal); // Twenty-first highlight (index 20) truncated
        Assert.Contains("[Open operator run](https://ops.example/app/)", md, StringComparison.Ordinal);
    }

    [Fact]
    public void Format_escapes_highlight_markdown_and_rejects_unsafe_deep_links()
    {
        ComparisonResult result = new()
        {
            BaseRunId = Guid.NewGuid(),
            TargetRunId = Guid.NewGuid(),
            TotalDeltaCount = 1,
            // Dangerous markers in highlights are rejected wholesale by EscapeBulletText; use markdown-only text here.
            SummaryHighlights = ["**bold** [x](https://example.com)"],
        };

        string md = GoldenManifestCompareMarkdownFormatter.Format(result, "javascript:alert(1)");

        Assert.Contains("\\*\\*bold\\*\\*", md, StringComparison.Ordinal);
        Assert.Contains("\\[x\\]", md, StringComparison.Ordinal);
        Assert.DoesNotContain("[Open operator run]", md, StringComparison.Ordinal);
    }

    [Fact]
    public void Format_without_highlights_and_white_space_deep_link_behaves_like_no_link()
    {
        Guid baseRun = Guid.NewGuid();
        Guid targetRun = Guid.NewGuid();
        ComparisonResult result = new()
        {
            BaseRunId = baseRun,
            TargetRunId = targetRun,
            TotalDeltaCount = 0,
            SummaryHighlights = [],
        };

        string md = GoldenManifestCompareMarkdownFormatter.Format(result, "   ");

        Assert.DoesNotContain("### Highlights", md, StringComparison.Ordinal);
        Assert.DoesNotContain("Open operator run", md, StringComparison.Ordinal);
    }
}
