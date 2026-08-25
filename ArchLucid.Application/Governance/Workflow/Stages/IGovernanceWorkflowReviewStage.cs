using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <summary>
///     Handles governance approval review (approve/reject), including segregation-of-duties checks,
///     same-transaction audit, and integration events.
/// </summary>
public interface IGovernanceWorkflowReviewStage
{
    Task<GovernanceApprovalRequest> ApproveAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        CancellationToken cancellationToken);

    Task<GovernanceApprovalRequest> RejectAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        CancellationToken cancellationToken);
}
