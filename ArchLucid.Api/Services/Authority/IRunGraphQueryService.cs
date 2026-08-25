using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Graph;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Api.Services.Authority;

/// <summary>
///     Application read surface for run graph, detail, list, and ROI telemetry queries.
/// </summary>
public interface IRunGraphQueryService
{
    Task<RunGraphDetailQueryResult> GetRunDetailAsync(string runId, CancellationToken cancellationToken);

    Task<RunRoiEstimateQueryResult> GetRunRoiEstimateAsync(string runId, CancellationToken cancellationToken);

    Task<RunStageTimelineQueryResult> GetRunStageTimelineAsync(string runId, CancellationToken cancellationToken);

    Task<RunInteractiveGraphQueryResult> GetInteractiveGraphSnapshotAsync(string runId, CancellationToken cancellationToken);

    Task<RunRoiTelemetryQueryResult> GetRoiTelemetryAsync(CancellationToken cancellationToken);

    Task<RunListQueryResult> ListRunsAsync(
        string? cursor,
        int? limit,
        int offset,
        int take,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}

public enum RunGraphQueryOutcome
{
    Success,
    BadRequest,
    NotFound,
    ManifestNotFound
}

public sealed class RunGraphDetailQueryResult
{
    public RunGraphQueryOutcome Outcome { get; init; }
    public RunDetailsResponse? Response { get; init; }
    public string? Etag { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class RunRoiEstimateQueryResult
{
    public RunGraphQueryOutcome Outcome { get; init; }
    public RunRoiScorecardDto? Estimate { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class RunStageTimelineQueryResult
{
    public RunGraphQueryOutcome Outcome { get; init; }
    public IReadOnlyList<StageTimelineSummary>? Timeline { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class RunInteractiveGraphQueryResult
{
    public RunGraphQueryOutcome Outcome { get; init; }
    public CytoscapeInteractiveGraphResponse? Response { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class RunRoiTelemetryQueryResult
{
    public RunRoiTelemetryAggregate Aggregate { get; init; } = null!;
}

public sealed class RunListQueryResult
{
    public CursorPagedResponse<RunListItemResponse> Body { get; init; } = null!;
    public string Etag { get; init; } = string.Empty;
}
