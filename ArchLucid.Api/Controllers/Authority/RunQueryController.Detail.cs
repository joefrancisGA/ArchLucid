using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Authority;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunQueryController
{
    /// <summary>
    ///     Returns the canonical run aggregate (tasks, results, manifest, decision traces) for <paramref name="runId" />.
    /// </summary>
    [HttpGet("review/{runId}")]
    [ProducesResponseType(typeof(RunDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRun(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunGraphDetailQueryResult result = await runGraphQueryService.GetRunDetailAsync(runId, cancellationToken);

        return result.Outcome switch
        {
            RunGraphQueryOutcome.Success => this.OkWithConditionalEtag(result.Response!, result.Etag!),
            RunGraphQueryOutcome.ManifestNotFound => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound)
        };
    }

    /// <summary>Directional analyst-hour estimate for packaging work implied by this run (configured multipliers).</summary>
    [HttpGet("review/{runId}/roi")]
    [ProducesResponseType(typeof(RunRoiScorecardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunRoiEstimate(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunRoiEstimateQueryResult result = await runGraphQueryService.GetRunRoiEstimateAsync(runId, cancellationToken);

        return result.Outcome == RunGraphQueryOutcome.Success
            ? Ok(result.Estimate)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound);
    }

    /// <summary>Authority pipeline stage start/end outcomes for operator run investigation (TB-250).</summary>
    [HttpGet("review/{runId}/stage-timeline")]
    [ProducesResponseType(typeof(IReadOnlyList<StageTimelineSummary>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunStageTimeline(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunStageTimelineQueryResult result =
            await runGraphQueryService.GetRunStageTimelineAsync(runId, cancellationToken);

        return result.Outcome switch
        {
            RunGraphQueryOutcome.Success => Ok(result.Timeline),
            RunGraphQueryOutcome.BadRequest => this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound)
        };
    }

    /// <summary>Aggregates ROI telemetry across all runs in the current scope.</summary>
    [HttpGet("telemetry/roi")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoiTelemetry(CancellationToken cancellationToken)
    {
        RunRoiTelemetryQueryResult result = await runGraphQueryService.GetRoiTelemetryAsync(cancellationToken);
        return Ok(result.Aggregate);
    }

    /// <summary>
    ///     Lists runs visible in the current scope. Without <paramref name="cursor" />, uses offset pagination via
    ///     <paramref name="limit" /> and <paramref name="offset" />; with <paramref name="cursor" />, uses keyset
    ///     continuation. Product clients may prefer <c>GET /v1/runs</c> (<see cref="AuthorityReadsController.ListRuns" />).
    /// </summary>
    [HttpGet("reviews")]
    [ProducesResponseType(typeof(CursorPagedResponse<RunListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public Task<IActionResult> ListRuns(
        [FromQuery] string? cursor = null,
        [FromQuery] int? limit = null,
        [FromQuery] int offset = 0,
        [FromQuery] int take = RunPagination.DefaultTake,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default) =>
        ListRunsCore(cursor, limit, offset, take, page, pageSize, cancellationToken);

    /// <summary>Legacy alias for <see cref="ListRuns" />.</summary>
    [Obsolete("Prefer GET /v1/architecture/reviews or GET /v1/runs. Retained for backward compatibility.")]
    [HttpGet("runs")]
    [ProducesResponseType(typeof(CursorPagedResponse<RunListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public Task<IActionResult> ListRunsLegacyAlias(
        [FromQuery] string? cursor = null,
        [FromQuery] int? limit = null,
        [FromQuery] int offset = 0,
        [FromQuery] int take = RunPagination.DefaultTake,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default) =>
        ListRunsCore(cursor, limit, offset, take, page, pageSize, cancellationToken);

    private async Task<IActionResult> ListRunsCore(
        string? cursor,
        int? limit,
        int offset,
        int take,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        RunListQueryResult result = await runGraphQueryService.ListRunsAsync(
            cursor,
            limit,
            offset,
            take,
            page,
            pageSize,
            cancellationToken);

        return this.OkWithConditionalEtag(result.Body, result.Etag);
    }
}
