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
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
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
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string html = sut.GenerateHtml(report, profile: null);

        html.Should().Contain("Compare Quality Delta");
        html.Should().Contain("Unsupported assumptions");
        html.Should().Contain("| 2 | 1 |");
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

    [SkippableFact]
    public void GenerateMarkdown_detailed_profile_includes_compare_quality_delta_once_with_default_summary_formatter()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string markdown = sut.GenerateMarkdown(report, EndToEndComparisonExportProfile.Detailed);

        markdown.Split("## Compare Quality Delta", StringSplitOptions.None).Length.Should().Be(2,
            "detailed exports embed the summary formatter, which already surfaces compare quality delta");
    }

    [SkippableFact]
    public void GenerateMarkdown_detailed_profile_includes_interpretation_notes_once_with_default_summary_formatter()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            InterpretationNotes = ["Structural execution mode differs between runs."],
            Warnings = ["One or both manifests were unavailable for manifest comparison."],
        };

        string markdown = sut.GenerateMarkdown(report, EndToEndComparisonExportProfile.Detailed);

        markdown.Split("## Interpretation Notes", StringSplitOptions.None).Length.Should().Be(2,
            "detailed exports embed the summary formatter, which already surfaces interpretation notes");
        markdown.Split("## Warnings", StringSplitOptions.None).Length.Should().Be(2,
            "detailed exports embed the summary formatter, which already surfaces warnings");
    }

    [SkippableFact]
    public void GenerateHtml_detailed_profile_includes_interpretation_notes_once_with_default_summary_formatter()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            InterpretationNotes = ["Structural execution mode differs between runs."],
            Warnings = ["One or both manifests were unavailable for manifest comparison."],
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Detailed);

        html.Split("<h2>Interpretation Notes</h2>", StringSplitOptions.None).Length.Should().Be(2);
        html.Split("<h2>Warnings</h2>", StringSplitOptions.None).Length.Should().Be(2);
    }
}
