using ArchLucid.Api.Models;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;

namespace ArchLucid.Api.Mapping;

internal static class ComparisonResponseMapper
{
    public static AgentResultCompareResponse ToAgentResultCompareResponse(AgentResultDiffResult diff)
    {
        return new AgentResultCompareResponse { Diff = diff };
    }

    public static AgentResultCompareSummaryResponse ToAgentResultCompareSummaryResponse(
        string summary,
        AgentResultDiffResult diff)
    {
        return new AgentResultCompareSummaryResponse { Format = "markdown", Summary = summary, Diff = diff };
    }

    public static EndToEndReplayComparisonResponse ToEndToEndResponse(EndToEndReplayComparisonReport report)
    {
        return new EndToEndReplayComparisonResponse { Report = report };
    }

    public static EndToEndReplayComparisonSummaryResponse ToEndToEndSummaryResponse(string summary)
    {
        return new EndToEndReplayComparisonSummaryResponse { Format = "markdown", Summary = summary };
    }

    public static EndToEndReplayComparisonExportResponse ToEndToEndExportResponse(
        string fileName,
        string markdown)
    {
        return new EndToEndReplayComparisonExportResponse
        {
            Format = "markdown", FileName = fileName, Content = markdown
        };
    }
}
