using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Internal operator forensics for full LLM trace bodies (prompts and raw model output). Not part of the buyer SDK (TB-287).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.RequireOperatorRole)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/internal/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class InternalArchitectureTraceForensicsController(
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IRunRepository authorityRunRepository,
    IScopeContextProvider scopeContextProvider)
    : ControllerBase
{
    /// <summary>
    ///     Returns a page of <see cref="AgentExecutionTraceSummary" /> rows for operator forensics lists
    ///     (no prompts or raw model output — use <see cref="GetTraceForensicsByTraceId" /> for full TraceJson).
    /// </summary>
    [HttpGet("run/{runId}/traces/forensics")]
    [HttpGet("review/{runId}/traces/forensics")]
    [ProducesResponseType(typeof(AgentExecutionTraceForensicsPageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunTraceForensics(
        [FromRoute] string runId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1)
            return this.BadRequestProblem("pageNumber must be at least 1.", ProblemTypes.ValidationFailed);

        if (pageSize is < 1 or > PagingParameters.MaxPageSize)
            return this.BadRequestProblem(
                $"pageSize must be between 1 and {PagingParameters.MaxPageSize}.",
                ProblemTypes.ValidationFailed);

        if (!await RunExistsInScopeAsync(runId, cancellationToken))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        PagingParameters paging = new()
        {
            PageNumber = pageNumber,
            PageSize = pageSize
        };
        (int skip, int take) = paging.Normalize();

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        (IReadOnlyList<AgentExecutionTraceSummary> summaries, int totalCount) =
            await agentExecutionTraceRepository.GetPagedSummariesByRunIdAsync(
                scope,
                runId,
                skip,
                take,
                cancellationToken);

        return Ok(new AgentExecutionTraceForensicsPageResponse
        {
            Traces = summaries.ToList(),
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        });
    }

    /// <summary>
    ///     Returns the full <see cref="AgentExecutionTrace" /> (prompts and raw model output) for operator forensics.
    /// </summary>
    [HttpGet("traces/forensics/{traceId}")]
    [ProducesResponseType(typeof(AgentExecutionTrace), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTraceForensicsByTraceId(
        [FromRoute] string traceId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(traceId))
            return this.BadRequestProblem("traceId is required.", ProblemTypes.ValidationFailed);

        AgentExecutionTrace? trace =
            await agentExecutionTraceRepository.GetByTraceIdAsync(traceId.Trim(), cancellationToken);

        if (trace is null)
            return this.NotFoundProblem($"Trace '{traceId}' was not found.", ProblemTypes.ResourceNotFound);

        if (!await RunExistsInScopeAsync(trace.RunId, cancellationToken))
            return this.NotFoundProblem($"Trace '{traceId}' was not found.", ProblemTypes.ResourceNotFound);

        return Ok(trace);
    }

    private async Task<bool> RunExistsInScopeAsync(string runId, CancellationToken cancellationToken)
    {
        if (!TryParseRunId(runId, out Guid runGuid))
            return false;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        return await authorityRunRepository.GetByIdAsync(scope, runGuid, cancellationToken) is not null;
    }

    private static bool TryParseRunId(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
