using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Application.Jobs;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Jobs;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Findings;

/// <summary>ADR 0062 — append-only finding verification reports linked to sealed packages.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/runs")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class FindingVerificationController(
    IFindingVerificationService findingVerificationService,
    IScopeContextProvider scopeProvider,
    IBackgroundJobQueue jobs,
    IOptionsMonitor<FindingVerificationOptions> verificationOptions,
    ILogger<FindingVerificationController> logger) : ControllerBase
{
    private readonly IFindingVerificationService _findingVerificationService =
        findingVerificationService ?? throw new ArgumentNullException(nameof(findingVerificationService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IBackgroundJobQueue _jobs = jobs ?? throw new ArgumentNullException(nameof(jobs));

    private readonly IOptionsMonitor<FindingVerificationOptions> _verificationOptions =
        verificationOptions ?? throw new ArgumentNullException(nameof(verificationOptions));

    private readonly ILogger<FindingVerificationController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>Creates an append-only verification report for a sealed run package.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{runId:guid}/finding-verification")]
    [ProducesResponseType(typeof(FindingVerificationReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(FindingVerificationReportResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(AsyncJobResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PostFindingVerificationAsync(
        Guid runId,
        [FromBody] CreateFindingVerificationReportRequest? request,
        [FromQuery] bool async = false,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        string? userId = User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        FindingVerificationOptions options = _verificationOptions.CurrentValue;

        if (options.DurableAsyncEnabled && async)
        {
            string correlationId = $"finding-verification:{runId:D}:{Guid.NewGuid():N}";
            FindingVerificationJobPayload payload = new(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                runId,
                request.VerificationFindingsSnapshotId,
                userId.Trim(),
                correlationId);

            int maxRetries = Math.Clamp(options.AsyncMaxRetries, 0, 10);
            string jobId = await _jobs
                .EnqueueAsync(new FindingVerificationWorkUnit(payload), maxRetries, cancellationToken)
                .ConfigureAwait(false);

            _logger.LogInformation(
                "Enqueued finding verification job {JobId} for run {RunId}.",
                jobId,
                runId);

            return Accepted(new AsyncJobResponse { JobId = jobId });
        }

        try
        {
            FindingVerificationCreateReportResult result = await _findingVerificationService.CreateReportAsync(
                scope,
                runId,
                request,
                userId,
                cancellationToken);

            _logger.LogInformation(
                "Finding verification report {ReportId} for run {RunId} with {ResultCount} results (created={CreatedNewReport}).",
                result.Response.ReportId,
                runId,
                result.Response.Results.Count,
                result.CreatedNewReport);

            if (result.CreatedNewReport)
            {
                return Created(
                    $"/v1/runs/{runId:D}/finding-verification/{result.Response.ReportId:D}",
                    result.Response);
            }

            return Ok(result.Response);
        }
        catch (FindingVerificationRunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (FindingVerificationSnapshotNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (FindingVerificationRunNotSealedException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }
}
