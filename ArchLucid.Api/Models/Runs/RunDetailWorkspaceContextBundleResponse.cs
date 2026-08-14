using ArchLucid.Api.Contracts;

namespace ArchLucid.Api.Models.Runs;

/// <summary>Run detail deferred workspace context: recent project runs and optional prior-committed compare.</summary>
public sealed class RunDetailWorkspaceContextBundleResponse
{
    public IReadOnlyList<RunSummaryResponse> RecentProjectRuns
    {
        get;
        init;
    } = [];

    public RunComparisonResponse? PriorCommittedRunComparison
    {
        get;
        init;
    }

    public Guid? PriorCommittedRunId
    {
        get;
        init;
    }

    public DateTime? PriorCommittedRunCreatedUtc
    {
        get;
        init;
    }
}
