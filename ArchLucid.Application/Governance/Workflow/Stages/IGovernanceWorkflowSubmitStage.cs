using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <summary>
///     Handles governance approval request submission, including dry-run validation, audit, and integration events.
/// </summary>
public interface IGovernanceWorkflowSubmitStage
{
    Task<GovernanceApprovalRequest> SubmitAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string requestedBy,
        string? requestedByActorKey,
        string? requestComment,
        bool dryRun,
        CancellationToken cancellationToken);
}
