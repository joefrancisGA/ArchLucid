using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Application workflow facade for governance approval-request HTTP routes.
/// </summary>
public interface IGovernanceApprovalRequestsFacade
{
    Task<GovernanceApprovalRequest> SubmitApprovalRequestAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string requestedBy,
        string? requestedByActorKey,
        string? requestComment,
        bool dryRun,
        CancellationToken ct);

    Task<GovernanceApprovalRequest> ApproveAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        string? reviewedByMailbox,
        CancellationToken ct);

    Task<GovernanceApprovalRequest> RejectAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        string? reviewedByMailbox,
        CancellationToken ct);

    Task<GovernanceBatchReviewResponse> BatchReviewAsync(
        IReadOnlyList<string> approvalRequestIds,
        bool approve,
        string? reviewComment,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewedByMailbox,
        CancellationToken ct);
}
