using ArchLucid.Application.Governance.Workflow.Stages;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Workflow;

/// <summary>
///     Thin orchestrator delegating governance lifecycle steps to stage handlers.
/// </summary>
public sealed class GovernanceWorkflowFacade(
    IGovernanceWorkflowSubmitStage submitStage,
    IGovernanceWorkflowReviewStage reviewStage,
    IGovernanceWorkflowPromoteStage promoteStage,
    IGovernanceWorkflowActivateStage activateStage) : IGovernanceWorkflowFacade
{
    private readonly IGovernanceWorkflowSubmitStage _submitStage =
        submitStage ?? throw new ArgumentNullException(nameof(submitStage));

    private readonly IGovernanceWorkflowReviewStage _reviewStage =
        reviewStage ?? throw new ArgumentNullException(nameof(reviewStage));

    private readonly IGovernanceWorkflowPromoteStage _promoteStage =
        promoteStage ?? throw new ArgumentNullException(nameof(promoteStage));

    private readonly IGovernanceWorkflowActivateStage _activateStage =
        activateStage ?? throw new ArgumentNullException(nameof(activateStage));

    /// <inheritdoc />
    public Task<GovernanceApprovalRequest> SubmitApprovalRequestAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string requestedBy,
        string? requestedByActorKey,
        string? requestComment,
        bool dryRun = false,
        CancellationToken cancellationToken = default) =>
        _submitStage.SubmitAsync(
            runId,
            manifestVersion,
            sourceEnvironment,
            targetEnvironment,
            requestedBy,
            requestedByActorKey,
            requestComment,
            dryRun,
            cancellationToken);

    /// <inheritdoc />
    public Task<GovernanceApprovalRequest> ApproveAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        CancellationToken cancellationToken = default) =>
        _reviewStage.ApproveAsync(approvalRequestId, reviewedBy, reviewedByActorKey, reviewComment, cancellationToken);

    /// <inheritdoc />
    public Task<GovernanceApprovalRequest> RejectAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        CancellationToken cancellationToken = default) =>
        _reviewStage.RejectAsync(approvalRequestId, reviewedBy, reviewedByActorKey, reviewComment, cancellationToken);

    /// <inheritdoc />
    public Task<GovernancePromotionRecord> PromoteAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string promotedBy,
        string? approvalRequestId,
        string? notes,
        bool dryRun = false,
        bool verbosePromotionValidationErrors = false,
        CancellationToken cancellationToken = default) =>
        _promoteStage.PromoteAsync(
            runId,
            manifestVersion,
            sourceEnvironment,
            targetEnvironment,
            promotedBy,
            approvalRequestId,
            notes,
            dryRun,
            verbosePromotionValidationErrors,
            cancellationToken);

    /// <inheritdoc />
    public Task<GovernanceEnvironmentActivation> ActivateAsync(
        string runId,
        string manifestVersion,
        string environment,
        string activatedBy,
        CancellationToken cancellationToken = default) =>
        _activateStage.ActivateAsync(runId, manifestVersion, environment, activatedBy, cancellationToken);
}
