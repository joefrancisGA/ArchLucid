using ArchLucid.Application.Analysis;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
///     Ensures compare quality delta counts appear in comparison exports (markdown/HTML/summary), not only in the UI.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CompareQualityDeltaExportTests
{
    private static CompareQualityDeltaCounts SampleDelta()
    {
        return new CompareQualityDeltaCounts
        {
            UnsupportedAssumptionsBefore = 2,
            UnsupportedAssumptionsAfter = 1,
            HighSeverityBefore = 3,
            HighSeverityAfter = 2,
            UncoveredMandatoryBefore = 4,
            UncoveredMandatoryAfter = 3,
            EvidenceBackedDecisionsBefore = 5,
            EvidenceBackedDecisionsAfter = 6,
        };
    }

    [SkippableFact]
    public void GenerateMarkdown_default_profile_includes_compare_quality_delta_table()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Stub summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string markdown = sut.GenerateMarkdown(report, profile: null);

        markdown.Should().Contain("## Compare Quality Delta");
        markdown.Should().Contain("Unsupported assumptions");
        markdown.Should().Contain("| 2 | 1 |");
    }

    [SkippableFact]
    public void GenerateHtml_default_profile_includes_compare_quality_delta_section()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("stub-summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string html = sut.GenerateHtml(report, profile: null);

        html.Should().Contain("<h2>Compare Quality Delta</h2>");
        html.Should().Contain("Unsupported assumptions");
        html.Should().Contain("before 2, after 1");
    }

    [SkippableFact]
    public void Summary_formatter_includes_compare_quality_delta_section()
    {
        MarkdownEndToEndReplayComparisonSummaryFormatter sut = new();
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string markdown = sut.FormatMarkdown(report);

        markdown.Should().Contain("## Compare Quality Delta");
        markdown.Should().Contain("Evidence-backed decisions");
        markdown.Should().Contain("| 5 | 6 |");
    }
}
