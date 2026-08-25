using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Workflow;

/// <summary>
///     Application workflow facade for governance lifecycle orchestration: approval submission,
///     review (approve/reject), promotion, and environment activation.
/// </summary>
public interface IGovernanceWorkflowFacade
{
    Task<GovernanceApprovalRequest> SubmitApprovalRequestAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string requestedBy,
        string? requestedByActorKey,
        string? requestComment,
        bool dryRun = false,
        CancellationToken cancellationToken = default);

    Task<GovernanceApprovalRequest> ApproveAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        CancellationToken cancellationToken = default);

    Task<GovernanceApprovalRequest> RejectAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        CancellationToken cancellationToken = default);

    Task<GovernancePromotionRecord> PromoteAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string promotedBy,
        string? approvalRequestId,
        string? notes,
        bool dryRun = false,
        bool verbosePromotionValidationErrors = false,
        CancellationToken cancellationToken = default);

    Task<GovernanceEnvironmentActivation> ActivateAsync(
        string runId,
        string manifestVersion,
        string environment,
        string activatedBy,
        CancellationToken cancellationToken = default);
}
