using ArchLucid.Api.Logging;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Determinism;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Internal QA and pipeline diagnostics (replay, determinism, seed). Not part of the product-facing SDK surface.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.RequireOperatorRole)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/internal/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class InternalArchitectureDiagnosticsController(
    IReplayRunService replayRunService,
    IArchitectureApplicationService architectureApplicationService,
    IDeterminismCheckService determinismCheckService,
    IActorContext actorContext,
    ILogger<InternalArchitectureDiagnosticsController> logger)
    : ControllerBase
{
    /// <summary>Re-executes agents for <paramref name="runId" /> (relocated from public architecture routes).</summary>
    [HttpPost("runs/{runId}/replay")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ReplayRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> ReplayRun(
        [FromRoute] string runId,
        [FromBody] ReplayRunRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ReplayRunRequest();

        string user = actorContext.GetActor();
        string correlationId = HttpContext.TraceIdentifier;

        try
        {
            ReplayRunResult result = await replayRunService.ReplayAsync(
                runId,
                request.ExecutionMode,
                request.CommitReplay,
                request.ManifestVersionOverride,
                cancellationToken);

            ReplayRunResponse response = RunResponseMapper.ToReplayRunResponse(
                result.OriginalRunId,
                result.ReplayRunId,
                result.ExecutionMode,
                result.Results,
                result.Manifest,
                result.DecisionTraces,
                result.Warnings);

            logger.LogInformation(
                "Run replayed (internal): OriginalRunId={OriginalRunId}, ReplayRunId={ReplayRunId}, ExecutionMode={ExecutionMode}, User={User}, CorrelationId={CorrelationId}",
                result.OriginalRunId,
                result.ReplayRunId,
                result.ExecutionMode,
                user,
                correlationId);

            return Ok(response);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "ReplayRun failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.BusinessRuleViolation);
        }
    }

    /// <summary>Determinism replay iterations for pipeline QA.</summary>
    [HttpPost("runs/{runId}/determinism-check")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(DeterminismCheckResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> RunDeterminismCheck(
        [FromRoute] string runId,
        [FromBody] DeterminismCheckRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        request.RunId = runId;

        try
        {
            DeterminismCheckResult result = await determinismCheckService.RunAsync(request, cancellationToken);

            return Ok(new DeterminismCheckResponse { Result = result });
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "DeterminismCheck failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.BusinessRuleViolation);
        }
    }

    /// <summary>Development seed path for simulator substitution.</summary>
    [HttpPost("runs/{runId}/seed-fake-results")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Authorize(Policy = "CanSeedResults")]
    [ProducesResponseType(typeof(SeedFakeResultsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SeedFakeResults(
        [FromRoute] string runId,
        [FromQuery] bool pilotTryRealModeFellBack = false,
        CancellationToken cancellationToken = default)
    {
        PilotSeedFakeResultsOptions? pilot =
            pilotTryRealModeFellBack ? new PilotSeedFakeResultsOptions(true) : null;

        SeedFakeResultsResult result =
            await architectureApplicationService.SeedFakeResultsAsync(runId, pilot, cancellationToken);
        if (!result.Success)
            return MapApplicationServiceFailure(result.Error, result.FailureKind, "Seed failed.");

        logger.LogInformation(
            "Fake results seeded (internal): RunId={RunId}, ResultCount={ResultCount}",
            runId,
            result.ResultCount);

        return Ok(new SeedFakeResultsResponse { ResultCount = result.ResultCount });
    }

    private IActionResult MapApplicationServiceFailure(string? error, ApplicationServiceFailureKind? kind,
        string defaultBadRequestDetail)
    {
        string detail = string.IsNullOrWhiteSpace(error) ? defaultBadRequestDetail : error;
        return kind switch
        {
            ApplicationServiceFailureKind.RunNotFound => this.NotFoundProblem(detail, ProblemTypes.RunNotFound),
            ApplicationServiceFailureKind.ResourceNotFound => this.NotFoundProblem(detail,
                ProblemTypes.ResourceNotFound),
            _ => this.BadRequestProblem(detail)
        };
    }
}
