using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Findings;

/// <summary>ADR 0062 slice 1 — append-only finding verification reports linked to sealed packages.</summary>
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
    ILogger<FindingVerificationController> logger) : ControllerBase
{
    private readonly IFindingVerificationService _findingVerificationService =
        findingVerificationService ?? throw new ArgumentNullException(nameof(findingVerificationService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ILogger<FindingVerificationController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>Creates an append-only verification report for a sealed run package.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{runId:guid}/finding-verification")]
    [ProducesResponseType(typeof(FindingVerificationReportResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PostFindingVerificationAsync(
        Guid runId,
        [FromBody] CreateFindingVerificationReportRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        string? userId = User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            FindingVerificationReportResponse response = await _findingVerificationService.CreateReportAsync(
                scope,
                runId,
                request,
                userId,
                cancellationToken);

            _logger.LogInformation(
                "Finding verification report {ReportId} created for run {RunId} with {ResultCount} results.",
                response.ReportId,
                runId,
                response.Results.Count);

            return Created(
                $"/v1/runs/{runId:D}/finding-verification/{response.ReportId:D}",
                response);
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
