using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
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

        (IActionResult? scopeError, string? normalizedRunId) =
            await RequireScopedRunAsync(request.RunId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        IActionResult? approvalIdProblem =
            ValidateApprovalRequestIdBody(request.ApprovalRequestId, out string? normalizedApprovalRequestId);

        if (approvalIdProblem is not null)
            return approvalIdProblem;

        if (normalizedApprovalRequestId is not null)
        {
            string approvalRequestId = normalizedApprovalRequestId;

            GovernanceApprovalRequest? approval = await approvalRepo
                .GetByIdAsync(approvalRequestId, cancellationToken)
                .ConfigureAwait(false);

            if (approval is null)
            {
                return this.NotFoundProblem(
                    $"Approval request '{approvalRequestId}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            (IActionResult? approvalRunScopeError, _) =
                await RequireScopedRunAsync(approval.RunId, cancellationToken).ConfigureAwait(false);

            if (approvalRunScopeError is not null)
                return approvalRunScopeError;
        }

        if (string.IsNullOrWhiteSpace(request.ManifestVersion))
            return this.BadRequestProblem("ManifestVersion is required.", ProblemTypes.ValidationFailed);

        if (request.ManifestVersion.Length > 128)
            return this.BadRequestProblem("ManifestVersion must not exceed 128 characters.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(request.SourceEnvironment))
            return this.BadRequestProblem("SourceEnvironment is required.", ProblemTypes.ValidationFailed);

        if (!GovernanceEnvironmentValidation.IsValid(request.SourceEnvironment))
        {
            return this.BadRequestProblem(
                "SourceEnvironment must be one of: dev, test, prod.",
                ProblemTypes.ValidationFailed);
        }

        if (string.IsNullOrWhiteSpace(request.TargetEnvironment))
            return this.BadRequestProblem("TargetEnvironment is required.", ProblemTypes.ValidationFailed);

        if (!GovernanceEnvironmentValidation.IsValid(request.TargetEnvironment))
        {
            return this.BadRequestProblem(
                "TargetEnvironment must be one of: dev, test, prod.",
                ProblemTypes.ValidationFailed);
        }

        if (string.Equals(request.SourceEnvironment.Trim(), request.TargetEnvironment.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return this.BadRequestProblem(
                "SourceEnvironment and TargetEnvironment must be different.",
                ProblemTypes.ValidationFailed);
        }

        if (!GovernanceEnvironmentOrder.IsValidPromotion(request.SourceEnvironment, request.TargetEnvironment))
        {
            return this.BadRequestProblem(
                "Promotion must follow environment ordering: dev → test → prod.",
                ProblemTypes.ValidationFailed);
        }

        if (request.Notes is not null && request.Notes.Length > 4000)
        {
            return this.BadRequestProblem(
                "Notes must not exceed 4000 characters.",
                ProblemTypes.ValidationFailed);
        }

        IActionResult? actorProblem = ValidateActorIdentityLength();

        if (actorProblem is not null)
            return actorProblem;

        string promotedBy = actorContext.GetActor();

        try
        {
            bool verbosePromotionValidationErrors = User.IsInRole(ArchLucidRoles.Admin);

            GovernancePromotionRecord result = await workflowService.PromoteAsync(
                normalizedRunId!,
                request.ManifestVersion,
                request.SourceEnvironment,
                request.TargetEnvironment,
                promotedBy,
                normalizedApprovalRequestId,
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
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Promote failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
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

        (IActionResult? scopeError, string? normalizedRunId) =
            await RequireScopedRunAsync(request.RunId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        if (string.IsNullOrWhiteSpace(request.ManifestVersion))
            return this.BadRequestProblem("ManifestVersion is required.", ProblemTypes.ValidationFailed);

        if (request.ManifestVersion.Length > 128)
            return this.BadRequestProblem("ManifestVersion must not exceed 128 characters.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(request.Environment))
            return this.BadRequestProblem("Environment is required.", ProblemTypes.ValidationFailed);

        if (!GovernanceEnvironmentValidation.IsValid(request.Environment))
        {
            return this.BadRequestProblem(
                "Environment must be one of: dev, test, prod.",
                ProblemTypes.ValidationFailed);
        }

        IActionResult? actorProblem = ValidateActorIdentityLength();

        if (actorProblem is not null)
            return actorProblem;

        try
        {
            GovernanceEnvironmentActivation result = await workflowService.ActivateAsync(
                normalizedRunId!,
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
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Activate failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Activate failed: invalid operation.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.BadRequest);
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

        (IActionResult? scopeError, string? normalizedRunId) =
            await RequireScopedRunAsync(runId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        IReadOnlyList<GovernanceApprovalRequest> items =
            await approvalRepo.GetByRunIdAsync(normalizedRunId!, cancellationToken);
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

        (IActionResult? scopeError, string? normalizedRunId) =
            await RequireScopedRunAsync(runId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        IReadOnlyList<GovernancePromotionRecord> items =
            await promotionRepo.GetByRunIdAsync(normalizedRunId!, cancellationToken);
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

        (IActionResult? scopeError, string? normalizedRunId) =
            await RequireScopedRunAsync(runId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        IReadOnlyList<GovernanceEnvironmentActivation> items =
            await activationRepo.GetByRunIdAsync(normalizedRunId!, cancellationToken);
        return Ok(items);
    }

    private async Task<(IActionResult? Error, string? NormalizedRunId)> RequireScopedRunAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return (this.BadRequestProblem(
                "Run id is required.",
                ProblemTypes.ValidationFailed), null);
        }

        runId = runId.Trim();

        if (runId.Length > 64)
        {
            return (this.BadRequestProblem(
                "RunId must not exceed 64 characters.",
                ProblemTypes.ValidationFailed), null);
        }

        if (!Guid.TryParse(runId, out Guid runGuid))
        {
            return (this.NotFoundProblem(
                $"Run '{runId}' was not found.",
                ProblemTypes.RunNotFound), null);
        }

        if (runGuid == Guid.Empty)
        {
            return (this.BadRequestProblem(
                "Run id is required.",
                ProblemTypes.ValidationFailed), null);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
        {
            return (this.NotFoundProblem(
                $"Run '{runId}' was not found.",
                ProblemTypes.RunNotFound), null);
        }

        return (null, runId);
    }
}
