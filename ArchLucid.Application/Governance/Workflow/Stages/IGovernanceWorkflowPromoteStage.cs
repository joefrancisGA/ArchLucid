using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <summary>
///     Handles manifest promotion between environments, including prod approval-chain validation and audit.
/// </summary>
public interface IGovernanceWorkflowPromoteStage
{
    Task<GovernancePromotionRecord> PromoteAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string promotedBy,
        string? approvalRequestId,
        string? notes,
        bool dryRun,
        bool verbosePromotionValidationErrors,
        CancellationToken cancellationToken);
}
