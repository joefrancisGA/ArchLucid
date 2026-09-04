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
    [HttpPost("approval-requests/{approvalRequestId}/approve")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(GovernanceApprovalRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(
        [FromRoute] string approvalRequestId,
        [FromBody] ApproveGovernanceRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? reviewCommentProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateReviewComment(request.ReviewComment)
                .ToBadRequestProblemOrNull(this);

        if (reviewCommentProblem is not null)
            return reviewCommentProblem;

        approvalRequestId = GovernanceApprovalRequestsHttpMapper.NormalizeApprovalRequestId(approvalRequestId);

        IActionResult? approvalRequestIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateApprovalRequestId(approvalRequestId)
                .ToBadRequestProblemOrNull(this);

        if (approvalRequestIdProblem is not null)
            return approvalRequestIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        string reviewedBy = actorContext.GetActor();
        string reviewedByActorKey = actorContext.GetActorId();
        string? reviewedByMailbox = actorContext.TryGetSubmitterMailbox();

        try
        {
            GovernanceApprovalRequest result = await _approvalRequestsFacade.ApproveAsync(
                approvalRequestId,
                reviewedBy,
                reviewedByActorKey,
                request.ReviewComment,
                reviewedByMailbox,
                cancellationToken);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning(ex, "Approve failed: approval request not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Approve failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (RunNotFoundException ex)
        {
            logger.LogWarning(ex, "Approve failed: run not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (GovernanceSelfApprovalException ex)
        {
            logger.LogWarningWithSanitizedUserArg(
                ex,
                "Approve blocked: segregation of duties for approval request '{ApprovalRequestId}'.",
                approvalRequestId);
            return this.BadRequestProblem(ex.Message, ProblemTypes.GovernanceSelfApproval);
        }
        catch (GovernanceApprovalReviewConflictException ex)
        {
            logger.LogWarningWithSanitizedUserArg(
                ex,
                "Approve conflict: approval request '{ApprovalRequestId}' already finalized by a concurrent request.",
                approvalRequestId);
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(
                ex,
                "Approve failed for approval request '{ApprovalRequestId}'.",
                approvalRequestId);
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("approval-requests/{approvalRequestId}/reject")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(GovernanceApprovalRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reject(
        [FromRoute] string approvalRequestId,
        [FromBody] RejectGovernanceRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? reviewCommentProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateReviewComment(request.ReviewComment)
                .ToBadRequestProblemOrNull(this);

        if (reviewCommentProblem is not null)
            return reviewCommentProblem;

        approvalRequestId = GovernanceApprovalRequestsHttpMapper.NormalizeApprovalRequestId(approvalRequestId);

        IActionResult? approvalRequestIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateApprovalRequestId(approvalRequestId)
                .ToBadRequestProblemOrNull(this);

        if (approvalRequestIdProblem is not null)
            return approvalRequestIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        string reviewedBy = actorContext.GetActor();
        string reviewedByActorKey = actorContext.GetActorId();
        string? reviewedByMailbox = actorContext.TryGetSubmitterMailbox();

        try
        {
            GovernanceApprovalRequest result = await _approvalRequestsFacade.RejectAsync(
                approvalRequestId,
                reviewedBy,
                reviewedByActorKey,
                request.ReviewComment,
                reviewedByMailbox,
                cancellationToken);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning(ex, "Reject failed: approval request not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Reject failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (RunNotFoundException ex)
        {
            logger.LogWarning(ex, "Reject failed: run not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (GovernanceSelfApprovalException ex)
        {
            logger.LogWarningWithSanitizedUserArg(
                ex,
                "Reject blocked: segregation of duties for approval request '{ApprovalRequestId}'.",
                approvalRequestId);
            return this.BadRequestProblem(ex.Message, ProblemTypes.GovernanceSelfApproval);
        }
        catch (GovernanceApprovalReviewConflictException ex)
        {
            logger.LogWarningWithSanitizedUserArg(
                ex,
                "Reject conflict: approval request '{ApprovalRequestId}' already finalized by a concurrent request.",
                approvalRequestId);
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(
                ex,
                "Reject failed for approval request '{ApprovalRequestId}'.",
                approvalRequestId);
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
