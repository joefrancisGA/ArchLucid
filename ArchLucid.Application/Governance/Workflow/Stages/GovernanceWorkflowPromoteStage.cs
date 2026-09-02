using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Workflow.Stages;

public sealed class GovernanceWorkflowPromoteStage(
    IGovernanceWorkflowPromoteValidateStage validateStage,
    IGovernanceWorkflowPromotePersistStage persistStage) : IGovernanceWorkflowPromoteStage
{
    private readonly IGovernanceWorkflowPromoteValidateStage _validateStage =
        validateStage ?? throw new ArgumentNullException(nameof(validateStage));

    private readonly IGovernanceWorkflowPromotePersistStage _persistStage =
        persistStage ?? throw new ArgumentNullException(nameof(persistStage));

    public async Task<GovernancePromotionRecord> PromoteAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string promotedBy,
        string? approvalRequestId,
        string? notes,
        bool dryRun,
        bool verbosePromotionValidationErrors,
        CancellationToken cancellationToken)
    {
        GovernanceWorkflowPromoteValidatedContext validated = await _validateStage.ValidateAsync(
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

        return await _persistStage.PersistAsync(validated, cancellationToken);
    }
}
