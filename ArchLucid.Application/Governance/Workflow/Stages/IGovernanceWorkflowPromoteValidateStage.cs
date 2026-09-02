namespace ArchLucid.Application.Governance.Workflow.Stages;

public interface IGovernanceWorkflowPromoteValidateStage
{
    Task<GovernanceWorkflowPromoteValidatedContext> ValidateAsync(
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
