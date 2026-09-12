using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;

using FluentAssertions;

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
                TargetGateLabel = "Gate pending",
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
}
