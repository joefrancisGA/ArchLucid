using ArchLucid.Application.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <inheritdoc cref="IGovernanceWorkflowReviewStage" />
public sealed class GovernanceWorkflowReviewStage(
    IGovernanceApprovalRequestRepository approvalRepo,
    IBaselineMutationAuditService baselineMutationAudit,
    GovernanceWorkflowAuditSupport auditSupport,
    GovernanceWorkflowIntegrationEventSupport integrationEvents,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    ILogger<GovernanceWorkflowReviewStage> logger) : IGovernanceWorkflowReviewStage
{
    private readonly IGovernanceApprovalRequestRepository _approvalRepo =
        approvalRepo ?? throw new ArgumentNullException(nameof(approvalRepo));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly GovernanceWorkflowAuditSupport _auditSupport =
        auditSupport ?? throw new ArgumentNullException(nameof(auditSupport));

    private readonly GovernanceWorkflowIntegrationEventSupport _integrationEvents =
        integrationEvents ?? throw new ArgumentNullException(nameof(integrationEvents));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory =
        unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly ILogger<GovernanceWorkflowReviewStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public Task<GovernanceApprovalRequest> ApproveAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        string? reviewedByMailbox = null,
        CancellationToken cancellationToken = default) =>
        ReviewAsync(
            approvalRequestId,
            reviewedBy,
            reviewedByActorKey,
            reviewComment,
            reviewedByMailbox,
            GovernanceApprovalStatus.Approved,
            AuditEventTypes.GovernanceApprovalApproved,
            AuditEventTypes.Baseline.Governance.ApprovalRequestApproved,
            cancellationToken);

    /// <inheritdoc />
    public Task<GovernanceApprovalRequest> RejectAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        string? reviewedByMailbox = null,
        CancellationToken cancellationToken = default) =>
        ReviewAsync(
            approvalRequestId,
            reviewedBy,
            reviewedByActorKey,
            reviewComment,
            reviewedByMailbox,
            GovernanceApprovalStatus.Rejected,
            AuditEventTypes.GovernanceApprovalRejected,
            AuditEventTypes.Baseline.Governance.ApprovalRequestRejected,
            cancellationToken);

    private async Task<GovernanceApprovalRequest> ReviewAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        string? reviewedByMailbox,
        string newStatus,
        string durableAuditEventType,
        string baselineEventType,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(approvalRequestId);
        ArgumentNullException.ThrowIfNull(reviewedBy);
        ArgumentNullException.ThrowIfNull(reviewedByActorKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(approvalRequestId);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedBy);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedByActorKey);

        GovernanceApprovalRequest request = await _approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken)
            ?? throw new InvalidOperationException($"Approval request '{approvalRequestId}' was not found.");

        await EnforceSegregationOfDutiesForReviewAsync(
            request,
            approvalRequestId,
            reviewedBy,
            reviewedByActorKey,
            reviewedByMailbox,
            cancellationToken);

        if (request.Status is not (GovernanceApprovalStatus.Draft or GovernanceApprovalStatus.Submitted))
        {
            if (IsIdenticalReviewRetry(request, newStatus, reviewedByActorKey, reviewComment))
                return request;

            throw new GovernanceApprovalReviewConflictException(approvalRequestId, newStatus == GovernanceApprovalStatus.Approved ? "approve" : "reject", request.Status);
        }

        DateTime reviewedUtc = TimeProvider.System.UtcNowDateTime();
        AuditEvent durableAuditEvent = _auditSupport.BuildGovernanceReviewAuditEvent(request, durableAuditEventType, reviewedBy, reviewComment);
        string durableAuditOperationLabel = string.Equals(newStatus, GovernanceApprovalStatus.Approved, StringComparison.Ordinal)
            ? $"GovernanceApprovalApproved:{LogSanitizer.Sanitize(approvalRequestId)}"
            : $"GovernanceApprovalRejected:{LogSanitizer.Sanitize(approvalRequestId)}";

        (GovernanceApprovalRequest reviewedRequest, bool wasIdempotentRetry) = await ExecuteGovernanceReviewDispositionAsync(
            approvalRequestId,
            request,
            newStatus,
            reviewedBy,
            reviewedByActorKey,
            reviewComment,
            reviewedUtc,
            durableAuditEvent,
            durableAuditOperationLabel,
            baselineEventType,
            $"Status={newStatus}",
            cancellationToken);

        if (wasIdempotentRetry)
            return reviewedRequest;

        if (_logger.IsEnabled(LogLevel.Information))
        {
            if (string.Equals(newStatus, GovernanceApprovalStatus.Approved, StringComparison.Ordinal))
            {
                _logger.LogInformation(
                    "Governance approval request approved: ApprovalRequestId={ApprovalRequestId}, ReviewedBy={ReviewedBy}",
                    LogSanitizer.Sanitize(request.ApprovalRequestId),
                    LogSanitizer.Sanitize(reviewedBy));
            }
            else
            {
                _logger.LogInformation(
                    "Governance approval request rejected: ApprovalRequestId={ApprovalRequestId}, ReviewedBy={ReviewedBy}",
                    LogSanitizer.Sanitize(request.ApprovalRequestId),
                    LogSanitizer.Sanitize(reviewedBy));
            }
        }

        if (string.Equals(newStatus, GovernanceApprovalStatus.Approved, StringComparison.Ordinal))
            await _integrationEvents.TryPublishApprovalApprovedAsync(request, reviewedBy, reviewedUtc, reviewComment, cancellationToken);
        else
            await _integrationEvents.TryPublishApprovalRejectedAsync(request, reviewedBy, reviewedUtc, reviewComment, cancellationToken);

        return reviewedRequest;
    }

    private static bool IsIdenticalReviewRetry(
        GovernanceApprovalRequest existing,
        string targetStatus,
        string reviewedByActorKey,
        string? reviewComment)
    {
        if (!string.Equals(existing.Status, targetStatus, StringComparison.Ordinal))
            return false;

        if (!string.Equals(existing.ReviewedByActorKey, reviewedByActorKey, StringComparison.Ordinal))
            return false;

        return ReviewCommentsMatch(existing.ReviewComment, reviewComment);
    }

    private static bool ReviewCommentsMatch(string? existingComment, string? requestedComment)
    {
        string? normalizedExisting = string.IsNullOrWhiteSpace(existingComment) ? null : existingComment.Trim();
        string? normalizedRequested = string.IsNullOrWhiteSpace(requestedComment) ? null : requestedComment.Trim();

        return string.Equals(normalizedExisting, normalizedRequested, StringComparison.OrdinalIgnoreCase);
    }

    private async Task EnforceSegregationOfDutiesForReviewAsync(
        GovernanceApprovalRequest request,
        string approvalRequestId,
        string reviewedByDisplay,
        string reviewedByActorKey,
        string? reviewedByMailbox,
        CancellationToken cancellationToken)
    {
        if (!GovernanceSegregationRules.IsSameActorForReview(
                request,
                reviewedByDisplay,
                reviewedByActorKey,
                reviewedByMailbox))
        {
            return;
        }

        await _auditSupport.LogSelfApprovalBlockedAsync(request, approvalRequestId, reviewedByDisplay, reviewedByActorKey, cancellationToken);
        throw new GovernanceSelfApprovalException(approvalRequestId, reviewedByDisplay);
    }

    private async Task<(GovernanceApprovalRequest Request, bool WasIdempotentRetry)> ExecuteGovernanceReviewDispositionAsync(
        string approvalRequestId,
        GovernanceApprovalRequest request,
        string newStatus,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        DateTime reviewedUtc,
        AuditEvent durableAuditEvent,
        string durableAuditOperationLabel,
        string baselineEventType,
        string baselineDetail,
        CancellationToken cancellationToken)
    {
        string reviewVerb = string.Equals(newStatus, GovernanceApprovalStatus.Approved, StringComparison.Ordinal) ? "approve" : "reject";
        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);

        if (uow.SupportsExternalTransaction)
        {
            try
            {
                bool transitioned = await _approvalRepo.TryTransitionFromReviewableAsync(
                    approvalRequestId,
                    newStatus,
                    reviewedBy,
                    reviewedByActorKey,
                    reviewComment,
                    reviewedUtc,
                    cancellationToken,
                    uow.Connection,
                    uow.Transaction);

                if (!transitioned)
                {
                    await uow.RollbackAsync(cancellationToken);
                    GovernanceApprovalRequest? idempotentRetry = await TryGetIdempotentReviewRetryAsync(
                        approvalRequestId,
                        newStatus,
                        reviewedByActorKey,
                        reviewComment,
                        cancellationToken);

                    if (idempotentRetry is not null)
                        return (idempotentRetry, true);

                    await ThrowGovernanceReviewConflictAsync(approvalRequestId, reviewVerb, cancellationToken);
                }

                await _auditSupport.LogGovernanceDurableWithRetryInUnitOfWorkAsync(
                    durableAuditEvent,
                    durableAuditOperationLabel,
                    uow,
                    cancellationToken);
                await uow.CommitAsync(cancellationToken);
            }
            catch
            {
                await uow.RollbackAsync(cancellationToken);
                throw;
            }
        }
        else
        {
            bool transitioned = await _approvalRepo.TryTransitionFromReviewableAsync(
                approvalRequestId,
                newStatus,
                reviewedBy,
                reviewedByActorKey,
                reviewComment,
                reviewedUtc,
                cancellationToken);

            if (!transitioned)
            {
                GovernanceApprovalRequest? idempotentRetry = await TryGetIdempotentReviewRetryAsync(
                    approvalRequestId,
                    newStatus,
                    reviewedByActorKey,
                    reviewComment,
                    cancellationToken);

                if (idempotentRetry is not null)
                    return (idempotentRetry, true);

                await ThrowGovernanceReviewConflictAsync(approvalRequestId, reviewVerb, cancellationToken);
            }

            await _auditSupport.LogGovernanceDurableWithRetryAsync(durableAuditEvent, durableAuditOperationLabel, cancellationToken);
        }

        request.Status = newStatus;
        request.ReviewedBy = reviewedBy;
        request.ReviewedByActorKey = reviewedByActorKey;
        request.ReviewComment = reviewComment;
        request.ReviewedUtc = reviewedUtc;
        await _baselineMutationAudit.RecordAsync(baselineEventType, reviewedBy, approvalRequestId, baselineDetail, cancellationToken);

        return (request, false);
    }

    private async Task<GovernanceApprovalRequest?> TryGetIdempotentReviewRetryAsync(
        string approvalRequestId,
        string newStatus,
        string reviewedByActorKey,
        string? reviewComment,
        CancellationToken cancellationToken)
    {
        GovernanceApprovalRequest? fresh = await _approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken);

        if (fresh is null)
            return null;

        if (!IsIdenticalReviewRetry(fresh, newStatus, reviewedByActorKey, reviewComment))
            return null;

        return fresh;
    }

    private async Task ThrowGovernanceReviewConflictAsync(string approvalRequestId, string reviewVerb, CancellationToken cancellationToken)
    {
        GovernanceApprovalRequest? fresh = await _approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken);
        if (fresh is null)
            throw new InvalidOperationException($"Approval request '{approvalRequestId}' was not found.");
        throw new GovernanceApprovalReviewConflictException(approvalRequestId, reviewVerb, fresh.Status);
    }
}
