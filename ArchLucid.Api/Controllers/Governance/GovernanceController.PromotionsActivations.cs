using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Http;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;


namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    [HttpPost("promotions")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(GovernancePromotionRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Promote(
        [FromBody] CreateGovernancePromotionRequest? request,
        [FromQuery] bool dryRun = false,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        (IActionResult? idempotencyError, _) = ReadGovernanceIdempotencyKey(!dryRun);

        if (idempotencyError is not null)
            return idempotencyError;

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IActionResult? scopeError = await RequireScopedRunAsync(request.RunId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        if (!string.IsNullOrWhiteSpace(request.ApprovalRequestId))
        {
            GovernanceApprovalRequest? approval = await approvalRepo
                .GetByIdAsync(request.ApprovalRequestId, cancellationToken)
                .ConfigureAwait(false);

            if (approval is null)
            {
                return this.NotFoundProblem(
                    $"Approval request '{request.ApprovalRequestId}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            IActionResult? approvalRunScopeError = await RequireScopedRunAsync(
                    approval.RunId,
                    cancellationToken)
                .ConfigureAwait(false);

            if (approvalRunScopeError is not null)
                return approvalRunScopeError;
        }

        string promotedBy = actorContext.GetActor();

        try
        {
            bool verbosePromotionValidationErrors = User.IsInRole(ArchLucidRoles.Admin);

            GovernancePromotionRecord result = await workflowService.PromoteAsync(
                request.RunId,
                request.ManifestVersion,
                request.SourceEnvironment,
                request.TargetEnvironment,
                promotedBy,
                request.ApprovalRequestId,
                request.Notes,
                dryRun,
                verbosePromotionValidationErrors,
                cancellationToken);

            if (dryRun)
                Response.Headers[ArchLucidHttpHeaders.DryRun] = "true";

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "Promote failed for run '{RunId}'.", request.RunId);
            return this.BadRequestProblem(ex.Message, ProblemTypes.BadRequest);
        }
        catch (RunNotFoundException ex)
        {
            logger.LogWarning(ex, "Promote failed: run not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (GoldenManifestVersionNotFoundException ex)
        {
            logger.LogWarning(ex, "Promote failed: manifest version not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.ManifestNotFound);
        }
    }

    [HttpPost("activations")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(GovernanceEnvironmentActivation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(
        [FromBody] CreateGovernanceActivationRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        (IActionResult? idempotencyError, _) = ReadGovernanceIdempotencyKey(true);

        if (idempotencyError is not null)
            return idempotencyError;

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IActionResult? scopeError = await RequireScopedRunAsync(request.RunId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        try
        {
            GovernanceEnvironmentActivation result = await workflowService.ActivateAsync(
                request.RunId,
                request.ManifestVersion,
                request.Environment,
                actorContext.GetActor(),
                cancellationToken);

            return Ok(result);
        }
        catch (RunNotFoundException ex)
        {
            logger.LogWarning(ex, "Activate failed: run not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (GoldenManifestVersionNotFoundException ex)
        {
            logger.LogWarning(ex, "Activate failed: manifest version not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.ManifestNotFound);
        }
    }
    [HttpGet("runs/{runId}/approval-requests")]
    [ProducesResponseType(typeof(IReadOnlyList<GovernanceApprovalRequest>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApprovalRequests(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IActionResult? scopeError = await RequireScopedRunAsync(runId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        IReadOnlyList<GovernanceApprovalRequest> items = await approvalRepo.GetByRunIdAsync(runId, cancellationToken);
        return Ok(items);
    }

    [HttpGet("runs/{runId}/promotions")]
    [ProducesResponseType(typeof(IReadOnlyList<GovernancePromotionRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPromotions(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IActionResult? scopeError = await RequireScopedRunAsync(runId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        IReadOnlyList<GovernancePromotionRecord> items = await promotionRepo.GetByRunIdAsync(runId, cancellationToken);
        return Ok(items);
    }

    [HttpGet("runs/{runId}/activations")]
    [ProducesResponseType(typeof(IReadOnlyList<GovernanceEnvironmentActivation>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActivations(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IActionResult? scopeError = await RequireScopedRunAsync(runId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        IReadOnlyList<GovernanceEnvironmentActivation> items =
            await activationRepo.GetByRunIdAsync(runId, cancellationToken);
        return Ok(items);
    }

    private async Task<IActionResult?> RequireScopedRunAsync(string runId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return this.NotFoundProblem(
                "Run id is required.",
                ProblemTypes.RunNotFound);
        }

        runId = runId.Trim();

        if (!Guid.TryParse(runId, out Guid runGuid))
        {
            return this.NotFoundProblem(
                $"Run '{runId}' was not found.",
                ProblemTypes.RunNotFound);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
        {
            return this.NotFoundProblem(
                $"Run '{runId}' was not found.",
                ProblemTypes.RunNotFound);
        }

        return null;
    }
}
