using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    /// <summary>Applies approve or reject to many approval requests; each id is evaluated independently (partial success).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("approval-requests/batch-review")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(GovernanceBatchReviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BatchReviewApprovalRequests(
        [FromBody] GovernanceApprovalBatchReviewRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? validationProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateBatchReviewRequest(body).ToBadRequestProblemOrNull(this);

        if (validationProblem is not null)
            return validationProblem;

        GovernanceApprovalRequestsHttpMapper.TryParseBatchReviewDecision(body.Decision!, out bool approve);

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        string reviewedBy = actorContext.GetActor();
        string reviewedByActorKey = actorContext.GetActorId();
        string? reviewedByMailbox = actorContext.TryGetSubmitterMailbox();

        Application.Governance.GovernanceBatchReviewResponse batchResult =
            await _approvalRequestsFacade.BatchReviewAsync(
                body.ApprovalRequestIds,
                approve,
                body.ReviewComment,
                reviewedBy,
                reviewedByActorKey,
                reviewedByMailbox,
                cancellationToken);

        return Ok(GovernanceApprovalRequestsHttpMapper.MapBatchReviewResponse(batchResult));
    }
}
