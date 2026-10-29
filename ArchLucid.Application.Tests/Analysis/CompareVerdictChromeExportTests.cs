using System.Text;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CompareVerdictChromeExportTests
{
    private static CompareVerdictChromeDelta SampleDelta()
    {
        return new CompareVerdictChromeDelta
        {
            GateOutcome = new CompareVerdictChromeGateOutcomeDelta
            {
                BaselineGateLabel = "Soft infeasible",
                TargetGateLabel = SendableExportCoverComposer.GateOutcomeNotStoredLine,
                Changed = true,
            },
            PackAssignment = new CompareVerdictChromePackAssignmentDelta
            {
                BaselineSummaryLine = "pack-a@1",
                TargetSummaryLine = "pack-b@2",
                Changed = true,
            },
            ExecutionMode = new CompareVerdictChromeExecutionModeDelta
            {
                BaselineModeLabel = "Simulator",
                TargetModeLabel = "Real",
                Changed = true,
                AdvisoryParagraph = "Baseline review used Simulator execution and updated used Real execution — finding and cost deltas may not be directly comparable.",
            },
            RoiHeadline = new CompareVerdictChromeRoiHeadlineDelta
            {
                BaselineSavingsLabel = "$1200.00",
                TargetSavingsLabel = "$2400.00",
            },
            Wk21Line = SendableExportCoverComposer.PolicyPackInfluenceHonestyLine,
            NonSummingLine = SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine,
        };
    }

    [SkippableFact]
    public void Summary_formatter_includes_compare_verdict_chrome_sections()
    {
        MarkdownEndToEndReplayComparisonSummaryFormatter sut = new();
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareVerdictChromeDelta = SampleDelta(),
        };

        string markdown = sut.FormatMarkdown(report);

        markdown.Should().Contain("## Compare Verdict Chrome Delta");
        markdown.Should().Contain("Pre-commit gate outcome");
        markdown.Should().Contain("Pack assignment");
        markdown.Should().Contain("Execution mode");
        markdown.Should().Contain(SendableExportCoverComposer.PolicyPackInfluenceHonestyLine);
        markdown.Should().Contain(SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine);
    }

    [SkippableFact]
    public void GenerateHtml_default_profile_includes_compare_verdict_chrome_section()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareVerdictChromeDelta = SampleDelta(),
        };

        string html = sut.GenerateHtml(report, profile: null);

        html.Should().Contain("<h2>Compare Verdict Chrome Delta</h2>");
        html.Should().Contain("Pre-commit gate outcome");
        html.Should().Contain(SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine);
    }

    [Fact]
    public void RemoveMarkdownSection_strips_through_duplicate_verdict_chrome_heading_until_next_distinct_section()
    {
        string markdown =
            "intro\n## Compare Verdict Chrome Delta\n### Gate\n\n## Compare Verdict Chrome Delta\n### Dup\n\n## Warnings\n";

        string result = CompareVerdictChromeExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Verdict Chrome Delta");
        result.Should().NotContain("### Dup");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_verdict_chrome_when_heading_uses_nbsp_after_hashes()
    {
        string markdown = "intro\n##\u00A0Compare Verdict Chrome Delta\n### Gate\n\n## Warnings\n";

        string result = CompareVerdictChromeExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Verdict Chrome Delta");
        result.Should().Contain("## Warnings");
    }

    [SkippableFact]
    public void GenerateHtml_detailed_profile_includes_verdict_chrome_once_when_summary_uses_nbsp_heading()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter
            .Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Summary\n##\u00A0Compare Verdict Chrome Delta\n### Pre-commit gate outcome\n| Baseline | Updated |");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareVerdictChromeDelta = SampleDelta(),
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Detailed);

        html.Split("<h2>Compare Verdict Chrome Delta</h2>", StringSplitOptions.None).Length.Should().Be(2,
            "NBSP-prefixed verdict chrome headings must be stripped before HTML re-appends the delta section");
    }

    [Fact]
    public void CompareQuality_CompareVerdictChromeExportFormatter_whitespace_only_savings_labels_use_omission_copy()
    {
        CompareVerdictChromeDelta delta = SampleDelta();
        delta.RoiHeadline!.BaselineSavingsLabel = "   ";
        delta.RoiHeadline.TargetSavingsLabel = "\t\n";

        StringBuilder markdownBuilder = new();
        CompareVerdictChromeExportFormatter.AppendMarkdown(markdownBuilder, delta);
        string markdown = markdownBuilder.ToString();

        markdown.Should().Contain("Baseline savings was not stored.");
        markdown.Should().Contain("Updated savings was not stored.");
        markdown.Should().NotContain("| Baseline review |    |");
    }

    [Fact]
    public void Roi_headline_missing_labels_uses_omission_copy_across_export_lines()
    {
        CompareVerdictChromeDelta delta = SampleDelta();
        delta.RoiHeadline!.BaselineSavingsLabel = null;
        delta.RoiHeadline.TargetSavingsLabel = null;

        StringBuilder markdownBuilder = new();
        CompareVerdictChromeExportFormatter.AppendMarkdown(markdownBuilder, delta);
        string markdown = markdownBuilder.ToString();
        StringBuilder htmlBuilder = new();
        CompareVerdictChromeExportFormatter.AppendHtml(htmlBuilder, delta);

        markdown.Should().Contain("Baseline savings was not stored.");
        markdown.Should().Contain("Updated savings was not stored.");
        htmlBuilder.ToString().Should().Contain("Baseline savings was not stored.");
        CompareVerdictChromeExportFormatter.BuildPlainTextLines(delta)
            .Should()
            .Contain(line => line.Contains("Baseline savings was not stored.", StringComparison.Ordinal));
    }
}
