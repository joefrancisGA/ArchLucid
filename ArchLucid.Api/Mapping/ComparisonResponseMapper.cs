using ArchLucid.Api.Models;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;

namespace ArchLucid.Api.Mapping;

internal static class ComparisonResponseMapper
{
    public static AgentResultCompareResponse ToAgentResultCompareResponse(AgentResultDiffResult diff) =>
        new()
        {
            Diff = diff
        };

    public static AgentResultCompareSummaryResponse ToAgentResultCompareSummaryResponse(
        string summary,
        AgentResultDiffResult diff) =>
        new()
        {
            Format = "markdown",
            Summary = summary,
            Diff = diff
        };

    public static EndToEndReplayComparisonResponse ToEndToEndResponse(EndToEndReplayComparisonReport report) =>
        new()
        {
            Report = report
        };

    public static EndToEndReplayComparisonSummaryResponse ToEndToEndSummaryResponse(string summary) =>
        new()
        {
            Format = "markdown",
            Summary = summary
        };

    public static EndToEndReplayComparisonExportResponse ToEndToEndExportResponse(
        string fileName,
        string markdown) =>
        new()
        {
            Format = "markdown",
            FileName = fileName,
            Content = markdown
        };
}
