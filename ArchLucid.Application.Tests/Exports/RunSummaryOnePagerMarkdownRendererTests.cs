using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunSummaryOnePagerMarkdownRendererTests
{
    [Fact]
    public void Render_includes_severity_table_executive_summary_and_top_findings()
    {
        RunSummaryOnePagerDocumentModel model = new()
        {
            RunId = "run-abc",
            SystemName = "Payments",
            CriticalCount = 1,
            HighCount = 2,
            MediumCount = 3,
            LowCount = 4,
            ExecutiveSummary = "Risk is elevated; remediate encryption first.",
            TopFindingTitles = ["Missing CMK", "Open ingress", "Stale DR plan"]
        };

        string markdown = RunSummaryOnePagerMarkdownRenderer.Render(model);

        markdown.Should().Contain("Payments");
        markdown.Should().Contain("run-abc");
        markdown.Should().Contain("| Critical | 1 |");
        markdown.Should().Contain("Risk is elevated; remediate encryption first.");
        markdown.Should().Contain("- Missing CMK");
        markdown.Should().Contain("- Open ingress");
        markdown.Should().Contain("- Stale DR plan");
    }
}
