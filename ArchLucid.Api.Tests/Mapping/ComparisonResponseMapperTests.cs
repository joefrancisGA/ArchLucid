using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Mapping;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ComparisonResponseMapperTests
{
    [Fact]
    public void ToAgentResultCompareResponse_wraps_diff()
    {
        AgentResultDiffResult diff = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
        };

        AgentResultCompareResponse response = ComparisonResponseMapper.ToAgentResultCompareResponse(diff);

        response.Diff.Should().BeSameAs(diff);
    }

    [Fact]
    public void ToAgentResultCompareSummaryResponse_sets_markdown_format_and_fields()
    {
        AgentResultDiffResult diff = new() { LeftRunId = "left", RightRunId = "right" };
        const string summary = "## Summary";

        ArchLucid.Api.Models.AgentResultCompareSummaryResponse response =
            ComparisonResponseMapper.ToAgentResultCompareSummaryResponse(summary, diff);

        response.Format.Should().Be("markdown");
        response.Summary.Should().Be(summary);
        response.Diff.Should().BeSameAs(diff);
    }

    [Fact]
    public void ToEndToEndResponse_wraps_report()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
        };

        EndToEndReplayComparisonResponse response = ComparisonResponseMapper.ToEndToEndResponse(report);

        response.Report.Should().BeSameAs(report);
    }

    [Fact]
    public void ToEndToEndSummaryResponse_sets_markdown_format_and_summary()
    {
        const string summary = "Replay delta";

        EndToEndReplayComparisonSummaryResponse response =
            ComparisonResponseMapper.ToEndToEndSummaryResponse(summary);

        response.Format.Should().Be("markdown");
        response.Summary.Should().Be(summary);
    }

    [Fact]
    public void ToEndToEndExportResponse_sets_markdown_export_fields()
    {
        const string fileName = "comparison.md";
        const string markdown = "# Comparison";

        EndToEndReplayComparisonExportResponse response =
            ComparisonResponseMapper.ToEndToEndExportResponse(fileName, markdown);

        response.Format.Should().Be("markdown");
        response.FileName.Should().Be(fileName);
        response.Content.Should().Be(markdown);
    }
}
