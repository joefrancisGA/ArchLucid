using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class EndToEndReplayComparisonReportNormalizerTests
{
    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_clears_whitespace_only_run_ids()
    {
        Guid rightRunGuid = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "   ",
            RightRunId = $"  {rightRunGuid:D}  ",
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.LeftRunId.Should().BeEmpty();
        report.RightRunId.Should().Be(rightRunGuid.ToString("N"));
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_nulls_whitespace_only_roi_headline_labels()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                RoiHeadline = new CompareVerdictChromeRoiHeadlineDelta
                {
                    BaselineSavingsLabel = "   ",
                    TargetSavingsLabel = "\t",
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta!.RoiHeadline.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_trims_roi_headline_when_one_side_has_meaningful_savings()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                RoiHeadline = new CompareVerdictChromeRoiHeadlineDelta
                {
                    BaselineSavingsLabel = "  $1200.00  ",
                    TargetSavingsLabel = "   ",
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta!.RoiHeadline.Should().NotBeNull();
        report.CompareVerdictChromeDelta.RoiHeadline!.BaselineSavingsLabel.Should().Be("$1200.00");
        report.CompareVerdictChromeDelta.RoiHeadline.TargetSavingsLabel.Should().BeNull();
    }
}
