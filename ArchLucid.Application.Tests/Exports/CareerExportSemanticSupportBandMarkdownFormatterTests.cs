using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CareerExportSemanticSupportBandMarkdownFormatterTests
{
    [Fact]
    public void FormatMarkdown_includes_scorer_version_and_stamp_counts()
    {
        string markdown = CareerExportSemanticSupportBandMarkdownFormatter.FormatMarkdown(
        [
            new Finding
            {
                FindingId = "f-1",
                Classification = FindingClassification.DecisionGradeFinding,
                SemanticSupportBand = FindingSemanticSupportBand.Supported,
            },
            new Finding
            {
                FindingId = "f-2",
                Classification = FindingClassification.DecisionGradeFinding,
                SemanticSupportBand = FindingSemanticSupportBand.Unsupported,
            },
        ]);

        markdown.Should().Contain("## Semantic support");
        markdown.Should().Contain(FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1);
        markdown.Should().Contain("1 Supported");
        markdown.Should().Contain("1 Unsupported");
    }

    [Fact]
    public void FormatMarkdown_omits_checklist_coverage_rows()
    {
        string markdown = CareerExportSemanticSupportBandMarkdownFormatter.FormatMarkdown(
        [
            new Finding
            {
                FindingId = "checklist",
                Classification = FindingClassification.ChecklistCoverage,
                SemanticSupportBand = FindingSemanticSupportBand.Supported,
            },
        ]);

        markdown.Should().BeEmpty();
    }
}
