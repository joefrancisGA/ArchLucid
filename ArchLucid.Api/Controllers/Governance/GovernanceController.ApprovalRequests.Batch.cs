using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.Data.Repositories;

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
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> BatchReviewApprovalRequests(
        [FromBody] GovernanceApprovalBatchReviewRequest? body,
        [FromServices] IGovernanceApprovalRequestRepository approvalRepository,
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

        Dictionary<string, Application.Governance.GovernanceBatchReviewItemResult> sealedPreflightFailures =
            new(StringComparer.OrdinalIgnoreCase);
        List<string> approvalRequestIdsForFacade = [];
        HashSet<string> checkedApprovalRequestIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (string rawApprovalRequestId in body.ApprovalRequestIds)
        {
            if (string.IsNullOrWhiteSpace(rawApprovalRequestId))
            {
                approvalRequestIdsForFacade.Add(rawApprovalRequestId);
                continue;
            }

            string approvalRequestId =
                GovernanceApprovalRequestsHttpMapper.NormalizeApprovalRequestId(rawApprovalRequestId);

            if (checkedApprovalRequestIds.Add(approvalRequestId))
            {
                IActionResult? sealedGuardResult = await EnsureSealedManifestReadAllowedForApprovalRequestAsync(
                    approvalRequestId,
                    approvalRepository,
                    cancellationToken);

                if (sealedGuardResult is ObjectResult { StatusCode: StatusCodes.Status409Conflict } conflictResult)
                {
                    sealedPreflightFailures[approvalRequestId] = MapSealedManifestBatchPreflightFailure(
                        approvalRequestId,
                        conflictResult);

                    continue;
                }

                if (sealedGuardResult is not null)
                    return sealedGuardResult;
            }

            approvalRequestIdsForFacade.Add(rawApprovalRequestId);
        }

        try
        {
            Application.Governance.GovernanceBatchReviewResponse batchResult =
                await _approvalRequestsFacade.BatchReviewAsync(
                    approvalRequestIdsForFacade,
                    approve,
                    body.ReviewComment,
                    reviewedBy,
                    reviewedByActorKey,
                    reviewedByMailbox,
                    cancellationToken);

            if (sealedPreflightFailures.Count == 0)
                return Ok(GovernanceApprovalRequestsHttpMapper.MapBatchReviewResponse(batchResult));

            Application.Governance.GovernanceBatchReviewResponse merged =
                MergeBatchReviewWithSealedPreflightFailures(
                    body.ApprovalRequestIds,
                    batchResult,
                    sealedPreflightFailures);

            return Ok(GovernanceApprovalRequestsHttpMapper.MapBatchReviewResponse(merged));
        }
        catch (ConflictException ex)
        {
            return MapGovernanceSealedManifestConflict(ex);
        }
    }

    private static Application.Governance.GovernanceBatchReviewItemResult MapSealedManifestBatchPreflightFailure(
        string approvalRequestId,
        ObjectResult conflictResult)
    {
        string message = conflictResult.Value switch
        {
            Microsoft.AspNetCore.Mvc.ProblemDetails problem => problem.Detail ?? problem.Title ?? "Conflict.",
            _ => "Conflict.",
        };

        return new Application.Governance.GovernanceBatchReviewItemResult
        {
            ApprovalRequestId = approvalRequestId,
            Succeeded = false,
            ErrorCode = ProblemTypes.Conflict,
            Message = message,
        };
    }

    private static Application.Governance.GovernanceBatchReviewResponse MergeBatchReviewWithSealedPreflightFailures(
        IReadOnlyList<string> requestedApprovalRequestIds,
        Application.Governance.GovernanceBatchReviewResponse facadeResult,
        IReadOnlyDictionary<string, Application.Governance.GovernanceBatchReviewItemResult> sealedPreflightFailures)
    {
        List<Application.Governance.GovernanceBatchReviewItemResult> merged = [];
        int facadeIndex = 0;

        foreach (string rawApprovalRequestId in requestedApprovalRequestIds)
        {
            if (string.IsNullOrWhiteSpace(rawApprovalRequestId))
            {
                merged.Add(facadeResult.Results[facadeIndex++]);
                continue;
            }

            string approvalRequestId =
                GovernanceApprovalRequestsHttpMapper.NormalizeApprovalRequestId(rawApprovalRequestId);

            if (sealedPreflightFailures.TryGetValue(approvalRequestId, out Application.Governance.GovernanceBatchReviewItemResult? blocked))
            {
                merged.Add(blocked);
                continue;
            }

            merged.Add(facadeResult.Results[facadeIndex++]);
        }

        return new Application.Governance.GovernanceBatchReviewResponse { Results = merged };
    }
}
