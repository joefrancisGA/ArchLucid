using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Default <see cref="IGovernanceApprovalRequestsFacade"/> consolidating approval-request route orchestration
///     previously in <c>GovernanceController.ApprovalRequests</c>.
/// </summary>
public sealed class GovernanceApprovalRequestsFacade(
    IGovernanceWorkflowFacade workflowFacade,
    IGovernanceApprovalRequestRepository approvalRepo,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository) : IGovernanceApprovalRequestsFacade
{
    private readonly IGovernanceWorkflowFacade _workflowFacade =
        workflowFacade ?? throw new ArgumentNullException(nameof(workflowFacade));

    private readonly IGovernanceApprovalRequestRepository _approvalRepo =
        approvalRepo ?? throw new ArgumentNullException(nameof(approvalRepo));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    /// <inheritdoc />
    public async Task<GovernanceApprovalRequest> SubmitApprovalRequestAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string requestedBy,
        string? requestedByActorKey,
        string? requestComment,
        bool dryRun,
        CancellationToken ct)
    {
        string normalizedRunId = await GovernanceRunScope.RequireScopedRunIdAsync(
            _scopeContextProvider,
            _runRepository,
            runId,
            ct);

        return await _workflowFacade.SubmitApprovalRequestAsync(
            normalizedRunId,
            manifestVersion,
            sourceEnvironment,
            targetEnvironment,
            requestedBy,
            requestedByActorKey,
            requestComment,
            dryRun,
            ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceApprovalRequest> ApproveAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        string? reviewedByMailbox,
        CancellationToken ct)
    {
        GovernanceApprovalRequest approval = await RequireScopedApprovalRequestAsync(approvalRequestId, ct);

        return await _workflowFacade.ApproveAsync(
            approvalRequestId,
            reviewedBy,
            reviewedByActorKey,
            reviewComment,
            reviewedByMailbox,
            ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceApprovalRequest> RejectAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        string? reviewedByMailbox,
        CancellationToken ct)
    {
        _ = await RequireScopedApprovalRequestAsync(approvalRequestId, ct);

        return await _workflowFacade.RejectAsync(
            approvalRequestId,
            reviewedBy,
            reviewedByActorKey,
            reviewComment,
            reviewedByMailbox,
            ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceBatchReviewResponse> BatchReviewAsync(
        IReadOnlyList<string> approvalRequestIds,
        bool approve,
        string? reviewComment,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewedByMailbox,
        CancellationToken ct)
    {
        List<GovernanceBatchReviewItemResult> results = [];
        HashSet<string> processedApprovalRequestIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (string rawApprovalRequestId in approvalRequestIds)
        {
            if (string.IsNullOrWhiteSpace(rawApprovalRequestId))
            {
                results.Add(
                    new GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = rawApprovalRequestId,
                        Succeeded = false,
                        ErrorCode = GovernanceFacadeProblemCodes.ValidationFailed,
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
                        ErrorCode = GovernanceFacadeProblemCodes.ValidationFailed,
                        Message = "duplicate approvalRequestId in batch.",
                    });

                continue;
            }

            try
            {
                GovernanceApprovalRequest? approval = await _approvalRepo
                    .GetByIdAsync(approvalRequestId, ct)
                    .ConfigureAwait(false);

                if (approval is null)
                {
                    results.Add(
                        new GovernanceBatchReviewItemResult
                        {
                            ApprovalRequestId = approvalRequestId,
                            Succeeded = false,
                            ErrorCode = GovernanceFacadeProblemCodes.ResourceNotFound,
                            Message = $"Approval request '{approvalRequestId}' was not found.",
                        });

                    continue;
                }

                GovernanceRunScopeResolution scopeResolution = await GovernanceRunScope.TryResolveScopedRunIdAsync(
                    _scopeContextProvider,
                    _runRepository,
                    approval.RunId,
                    ct);

                if (!scopeResolution.Succeeded)
                {
                    results.Add(
                        new GovernanceBatchReviewItemResult
                        {
                            ApprovalRequestId = approvalRequestId,
                            Succeeded = false,
                            ErrorCode = scopeResolution.ErrorCode!,
                            Message = scopeResolution.Message!,
                        });

                    continue;
                }

                if (approve)
                {
                    _ = await _workflowFacade.ApproveAsync(
                        approvalRequestId,
                        reviewedBy,
                        reviewedByActorKey,
                        reviewComment,
                        reviewedByMailbox,
                        ct);
                }
                else
                {
                    _ = await _workflowFacade.RejectAsync(
                        approvalRequestId,
                        reviewedBy,
                        reviewedByActorKey,
                        reviewComment,
                        reviewedByMailbox,
                        ct);
                }

                results.Add(
                    new GovernanceBatchReviewItemResult { ApprovalRequestId = approvalRequestId, Succeeded = true });
            }
            catch (GovernanceSelfApprovalException ex)
            {
                results.Add(
                    new GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = approvalRequestId,
                        Succeeded = false,
                        ErrorCode = GovernanceFacadeProblemCodes.GovernanceSelfApproval,
                        Message = ex.Message,
                    });
            }
            catch (GovernanceApprovalReviewConflictException ex)
            {
                results.Add(
                    new GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = approvalRequestId,
                        Succeeded = false,
                        ErrorCode = GovernanceFacadeProblemCodes.Conflict,
                        Message = ex.Message,
                    });
            }
            catch (InvalidOperationException ex)
            {
                results.Add(
                    new GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = approvalRequestId,
                        Succeeded = false,
                        ErrorCode = GovernanceFacadeProblemCodes.ValidationFailed,
                        Message = ex.Message,
                    });
            }
        }

        return new GovernanceBatchReviewResponse { Results = results };
    }

    private async Task<GovernanceApprovalRequest> RequireScopedApprovalRequestAsync(
        string approvalRequestId,
        CancellationToken ct)
    {
        GovernanceApprovalRequest? approval = await _approvalRepo
            .GetByIdAsync(approvalRequestId, ct)
            .ConfigureAwait(false);

        if (approval is null)
            throw new KeyNotFoundException($"Approval request '{approvalRequestId}' was not found.");

        await GovernanceRunScope.RequireScopedRunIdAsync(
            _scopeContextProvider,
            _runRepository,
            approval.RunId,
            ct);

        return approval;
    }
}
