using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Default implementation of <see cref="IGovernanceWorkflowService"/> delegating to
///     <see cref="IGovernanceWorkflowFacade"/>.
/// </summary>
public sealed class GovernanceWorkflowService(IGovernanceWorkflowFacade workflowFacade) : IGovernanceWorkflowService
{
    private readonly IGovernanceWorkflowFacade _workflowFacade =
        workflowFacade ?? throw new ArgumentNullException(nameof(workflowFacade));

    /// <inheritdoc/>
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
        _workflowFacade.SubmitApprovalRequestAsync(
            runId,
            manifestVersion,
            sourceEnvironment,
            targetEnvironment,
            requestedBy,
            requestedByActorKey,
            requestComment,
            dryRun,
            cancellationToken);

    /// <inheritdoc/>
    public Task<GovernanceApprovalRequest> ApproveAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        CancellationToken cancellationToken = default) =>
        _workflowFacade.ApproveAsync(approvalRequestId, reviewedBy, reviewedByActorKey, reviewComment, cancellationToken);

    /// <inheritdoc/>
    public Task<GovernanceApprovalRequest> RejectAsync(
        string approvalRequestId,
        string reviewedBy,
        string reviewedByActorKey,
        string? reviewComment,
        CancellationToken cancellationToken = default) =>
        _workflowFacade.RejectAsync(approvalRequestId, reviewedBy, reviewedByActorKey, reviewComment, cancellationToken);

    /// <inheritdoc/>
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
        _workflowFacade.PromoteAsync(
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

    /// <inheritdoc/>
    public Task<GovernanceEnvironmentActivation> ActivateAsync(
        string runId,
        string manifestVersion,
        string environment,
        string activatedBy,
        CancellationToken cancellationToken = default) =>
        _workflowFacade.ActivateAsync(runId, manifestVersion, environment, activatedBy, cancellationToken);
}
