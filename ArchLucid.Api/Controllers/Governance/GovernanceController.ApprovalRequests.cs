using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.Authority;
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

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;


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

        (IActionResult? idempotencyError, string? idempotencyKey) = ReadGovernanceIdempotencyKey(!dryRun);

        if (idempotencyError is not null)
            return idempotencyError;

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        (IActionResult? scopeError, string? normalizedRunId) =
            await RequireScopedRunAsync(request.RunId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        string requestedBy = actorContext.GetActor();
        string requestedByActorKey = actorContext.GetActorId();

        try
        {
            GovernanceApprovalRequest result = await workflowService.SubmitApprovalRequestAsync(
                normalizedRunId!,
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

        approvalRequestId = NormalizeApprovalRequestId(approvalRequestId);

        IActionResult? approvalRequestIdProblem = BadRequestWhenApprovalRequestIdEmpty(approvalRequestId);

        if (approvalRequestIdProblem is not null)
            return approvalRequestIdProblem;

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GovernanceApprovalRequest? approval = await approvalRepo
            .GetByIdAsync(approvalRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (approval is null)
        {
            return this.NotFoundProblem(
                $"Approval request '{approvalRequestId}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        (IActionResult? scopeError, _) =
            await RequireScopedRunAsync(approval.RunId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        string reviewedBy = actorContext.GetActor();
        string reviewedByActorKey = actorContext.GetActorId();
        string? reviewedByMailbox = actorContext.TryGetSubmitterMailbox();

        try
        {
            GovernanceApprovalRequest result = await workflowService.ApproveAsync(
                approvalRequestId,
                reviewedBy,
                reviewedByActorKey,
                request.ReviewComment,
                reviewedByMailbox,
                cancellationToken);

            return Ok(result);
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
            return this.BadRequestProblem(ex.Message, ProblemTypes.BadRequest);
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

        approvalRequestId = NormalizeApprovalRequestId(approvalRequestId);

        IActionResult? approvalRequestIdProblem = BadRequestWhenApprovalRequestIdEmpty(approvalRequestId);

        if (approvalRequestIdProblem is not null)
            return approvalRequestIdProblem;

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GovernanceApprovalRequest? approval = await approvalRepo
            .GetByIdAsync(approvalRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (approval is null)
        {
            return this.NotFoundProblem(
                $"Approval request '{approvalRequestId}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        (IActionResult? scopeError, _) =
            await RequireScopedRunAsync(approval.RunId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        string reviewedBy = actorContext.GetActor();
        string reviewedByActorKey = actorContext.GetActorId();
        string? reviewedByMailbox = actorContext.TryGetSubmitterMailbox();

        try
        {
            GovernanceApprovalRequest result = await workflowService.RejectAsync(
                approvalRequestId,
                reviewedBy,
                reviewedByActorKey,
                request.ReviewComment,
                reviewedByMailbox,
                cancellationToken);

            return Ok(result);
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
            return this.BadRequestProblem(ex.Message, ProblemTypes.BadRequest);
        }
    }

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

        if (body.ApprovalRequestIds is null || body.ApprovalRequestIds.Count == 0)
            return this.BadRequestProblem("ApprovalRequestIds must contain at least one id.",
                ProblemTypes.ValidationFailed);

        if (body.ApprovalRequestIds.Count > 50)
            return this.BadRequestProblem("At most 50 approval request ids are allowed per request.",
                ProblemTypes.ValidationFailed);

        if (body.Decision is null)
            return this.BadRequestProblem("Decision is required (approve or reject).", ProblemTypes.ValidationFailed);

        string decision = body.Decision.Trim();

        if (decision.Length == 0)
            return this.BadRequestProblem("Decision is required (approve or reject).", ProblemTypes.ValidationFailed);

        bool approve = string.Equals(decision, "approve", StringComparison.OrdinalIgnoreCase);
        bool reject = string.Equals(decision, "reject", StringComparison.OrdinalIgnoreCase);

        if (!approve && !reject)
            return this.BadRequestProblem("Decision must be 'approve' or 'reject'.", ProblemTypes.ValidationFailed);

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        string reviewedBy = actorContext.GetActor();
        string reviewedByActorKey = actorContext.GetActorId();
        string? reviewedByMailbox = actorContext.TryGetSubmitterMailbox();

        List<GovernanceBatchReviewItemResult> results = [];

        if (!body.ApprovalRequestIds.Any(static id => !string.IsNullOrWhiteSpace(id)))
        {
            return this.BadRequestProblem(
                "ApprovalRequestIds must contain at least one non-empty id.",
                ProblemTypes.ValidationFailed);
        }

        HashSet<string> processedApprovalRequestIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (string rawApprovalRequestId in body.ApprovalRequestIds)
        {
            if (string.IsNullOrWhiteSpace(rawApprovalRequestId))
            {
                results.Add(
                    new GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = rawApprovalRequestId,
                        Succeeded = false,
                        ErrorCode = ProblemTypes.ValidationFailed,
                        Message = "approvalRequestId is required.",
                    });

                continue;
            }

            string approvalRequestId = rawApprovalRequestId.Trim();

            if (!processedApprovalRequestIds.Add(approvalRequestId))
            {
                results.Add(
                    new GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = approvalRequestId,
                        Succeeded = false,
                        ErrorCode = ProblemTypes.ValidationFailed,
                        Message = $"ApprovalRequestIds contains a duplicate id: '{approvalRequestId}'.",
                    });

                continue;
            }

            try
            {
                GovernanceApprovalRequest? approval = await approvalRepo
                    .GetByIdAsync(approvalRequestId, cancellationToken)
                    .ConfigureAwait(false);

                if (approval is null)
                {
                    results.Add(
                        new GovernanceBatchReviewItemResult
                        {
                            ApprovalRequestId = approvalRequestId,
                            Succeeded = false,
                            ErrorCode = ProblemTypes.ResourceNotFound,
                            Message = $"Approval request '{approvalRequestId}' was not found.",
                        });

                    continue;
                }

                (IActionResult? scopeError, _) =
                    await RequireScopedRunAsync(approval.RunId, cancellationToken).ConfigureAwait(false);

                if (scopeError is not null)
                {
                    string errorCode = ProblemTypes.RunNotFound;
                    string message = $"Run '{approval.RunId}' was not found.";

                    if (scopeError is ObjectResult { Value: Microsoft.AspNetCore.Mvc.ProblemDetails scopeProblem })
                    {
                        if (!string.IsNullOrWhiteSpace(scopeProblem.Type))
                            errorCode = scopeProblem.Type;

                        if (!string.IsNullOrWhiteSpace(scopeProblem.Detail))
                            message = scopeProblem.Detail;
                    }

                    results.Add(
                        new GovernanceBatchReviewItemResult
                        {
                            ApprovalRequestId = approvalRequestId,
                            Succeeded = false,
                            ErrorCode = errorCode,
                            Message = message,
                        });

                    continue;
                }

                if (approve)

                    _ = await workflowService.ApproveAsync(
                        approvalRequestId,
                        reviewedBy,
                        reviewedByActorKey,
                        body.ReviewComment,
                        reviewedByMailbox,
                        cancellationToken);

                else

                    _ = await workflowService.RejectAsync(
                        approvalRequestId,
                        reviewedBy,
                        reviewedByActorKey,
                        body.ReviewComment,
                        reviewedByMailbox,
                        cancellationToken);

                results.Add(
                    new GovernanceBatchReviewItemResult { ApprovalRequestId = approvalRequestId, Succeeded = true });
            }
            catch (GovernanceSelfApprovalException ex)
            {
                logger.LogWarningWithSanitizedUserArg(
                    ex,
                    "Batch review blocked: segregation of duties for approval request '{ApprovalRequestId}'.",
                    approvalRequestId);
                results.Add(
                    new GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = approvalRequestId,
                        Succeeded = false,
                        ErrorCode = ProblemTypes.GovernanceSelfApproval,
                        Message = ex.Message
                    });
            }
            catch (GovernanceApprovalReviewConflictException ex)
            {
                logger.LogWarningWithSanitizedUserArg(
                    ex,
                    "Batch review conflict: approval request '{ApprovalRequestId}'.",
                    approvalRequestId);
                results.Add(
                    new GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = approvalRequestId,
                        Succeeded = false,
                        ErrorCode = ProblemTypes.Conflict,
                        Message = ex.Message
                    });
            }
            catch (InvalidOperationException ex)
            {
                logger.LogWarningWithSanitizedUserArg(
                    ex,
                    "Batch review failed for approval request '{ApprovalRequestId}'.",
                    approvalRequestId);
                results.Add(
                    new GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = approvalRequestId,
                        Succeeded = false,
                        ErrorCode = ProblemTypes.BadRequest,
                        Message = ex.Message
                    });
            }
        }

        return Ok(new GovernanceBatchReviewResponse { Results = results });
    }

}
