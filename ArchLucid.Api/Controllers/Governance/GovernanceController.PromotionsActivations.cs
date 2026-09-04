using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

        IActionResult? runIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRouteRunId(request.RunId)
                .ToBadRequestProblemOrNull(this);

        if (runIdProblem is not null)
            return runIdProblem;

        IActionResult? manifestVersionProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateManifestVersion(request.ManifestVersion)
                .ToBadRequestProblemOrNull(this);

        if (manifestVersionProblem is not null)
            return manifestVersionProblem;

        IActionResult? sourceEnvironmentProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateEnvironmentSlug(request.SourceEnvironment, "SourceEnvironment")
                .ToBadRequestProblemOrNull(this);

        if (sourceEnvironmentProblem is not null)
            return sourceEnvironmentProblem;

        IActionResult? targetEnvironmentProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateEnvironmentSlug(request.TargetEnvironment, "TargetEnvironment")
                .ToBadRequestProblemOrNull(this);

        if (targetEnvironmentProblem is not null)
            return targetEnvironmentProblem;

        IActionResult? notesProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateOptionalGovernanceComment(request.Notes, "Notes")
                .ToBadRequestProblemOrNull(this);

        if (notesProblem is not null)
            return notesProblem;

        IActionResult? approvalRequestIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateOptionalApprovalRequestId(request.ApprovalRequestId)
                .ToBadRequestProblemOrNull(this);

        if (approvalRequestIdProblem is not null)
            return approvalRequestIdProblem;

        IActionResult? promotionValidationProblem =
            GovernancePromotionHttpMapper.Validate(request).ToBadRequestProblemOrNull(this);

        if (promotionValidationProblem is not null)
            return promotionValidationProblem;

        (IActionResult? idempotencyError, _) = ReadGovernanceIdempotencyKey(!dryRun);

        if (idempotencyError is not null)
            return idempotencyError;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        string promotedBy = actorContext.GetActor();

        try
        {
            bool verbosePromotionValidationErrors = User.IsInRole(ArchLucidRoles.Admin);

            GovernancePromotionRecord result = await _promotionsActivationsFacade.PromoteAsync(
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
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Promote failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning(ex, "Promote failed: approval request not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "Promote failed for run '{RunId}'.", request.RunId);
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
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

        IActionResult? runIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRouteRunId(request.RunId)
                .ToBadRequestProblemOrNull(this);

        if (runIdProblem is not null)
            return runIdProblem;

        IActionResult? manifestVersionProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateManifestVersion(request.ManifestVersion)
                .ToBadRequestProblemOrNull(this);

        if (manifestVersionProblem is not null)
            return manifestVersionProblem;

        IActionResult? environmentProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateEnvironmentSlug(request.Environment, "Environment")
                .ToBadRequestProblemOrNull(this);

        if (environmentProblem is not null)
            return environmentProblem;

        IActionResult? activationValidationProblem =
            GovernanceActivationHttpMapper.Validate(request).ToBadRequestProblemOrNull(this);

        if (activationValidationProblem is not null)
            return activationValidationProblem;

        (IActionResult? idempotencyError, _) = ReadGovernanceIdempotencyKey(true);

        if (idempotencyError is not null)
            return idempotencyError;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            GovernanceEnvironmentActivation result = await _promotionsActivationsFacade.ActivateAsync(
                request.RunId,
                request.ManifestVersion,
                request.Environment,
                actorContext.GetActor(),
                cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Activate failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
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
        IActionResult? runIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRouteRunId(runId)
                .ToBadRequestProblemOrNull(this);

        if (runIdProblem is not null)
            return runIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            IReadOnlyList<GovernanceApprovalRequest> items =
                await _promotionsActivationsFacade.ListApprovalRequestsByRunIdAsync(runId, cancellationToken);
            return Ok(items);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    [HttpGet("runs/{runId}/promotions")]
    [ProducesResponseType(typeof(IReadOnlyList<GovernancePromotionRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPromotions(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        IActionResult? runIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRouteRunId(runId)
                .ToBadRequestProblemOrNull(this);

        if (runIdProblem is not null)
            return runIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            IReadOnlyList<GovernancePromotionRecord> items =
                await _promotionsActivationsFacade.ListPromotionsByRunIdAsync(runId, cancellationToken);
            return Ok(items);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    [HttpGet("runs/{runId}/activations")]
    [ProducesResponseType(typeof(IReadOnlyList<GovernanceEnvironmentActivation>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActivations(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        IActionResult? runIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRouteRunId(runId)
                .ToBadRequestProblemOrNull(this);

        if (runIdProblem is not null)
            return runIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            IReadOnlyList<GovernanceEnvironmentActivation> items =
                await _promotionsActivationsFacade.ListActivationsByRunIdAsync(runId, cancellationToken);
            return Ok(items);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }
}
