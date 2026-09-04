using ArchLucid.Api.Controllers.Authority;
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
    // idempotency-posture: explicit-idempotency-key
    [IdempotencyFilter]
    [HttpPost("approval-requests")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(GovernanceApprovalRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitApprovalRequest(
        [FromBody] CreateGovernanceApprovalRequest? request,
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

        IActionResult? requestCommentProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateOptionalGovernanceComment(request.RequestComment, "RequestComment")
                .ToBadRequestProblemOrNull(this);

        if (requestCommentProblem is not null)
            return requestCommentProblem;

        IActionResult? approvalRequestValidationProblem =
            GovernanceApprovalRequestHttpMapper.Validate(request).ToBadRequestProblemOrNull(this);

        if (approvalRequestValidationProblem is not null)
            return approvalRequestValidationProblem;

        (IActionResult? idempotencyError, string? idempotencyKey) = ReadGovernanceIdempotencyKey(!dryRun);

        if (idempotencyError is not null)
            return idempotencyError;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        string requestedBy = actorContext.GetActor();
        string requestedByActorKey = actorContext.GetActorId();

        try
        {
            GovernanceApprovalRequest result = await _approvalRequestsFacade.SubmitApprovalRequestAsync(
                request.RunId,
                request.ManifestVersion,
                request.SourceEnvironment,
                request.TargetEnvironment,
                requestedBy,
                requestedByActorKey,
                request.RequestComment,
                dryRun,
                cancellationToken);

            if (dryRun)
                Response.Headers[ArchLucidHttpHeaders.DryRun] = "true";

            if (!dryRun && idempotencyKey is not null)
                await LogGovernanceApprovalRequestedAuditAsync(request, idempotencyKey, cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "SubmitApprovalRequest failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "SubmitApprovalRequest failed for run '{RunId}'.", request.RunId);
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (RunNotFoundException ex)
        {
            logger.LogWarning(ex, "SubmitApprovalRequest failed: run not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (GoldenManifestVersionNotFoundException ex)
        {
            logger.LogWarning(ex, "SubmitApprovalRequest failed: manifest version not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.ManifestNotFound);
        }
    }
}
