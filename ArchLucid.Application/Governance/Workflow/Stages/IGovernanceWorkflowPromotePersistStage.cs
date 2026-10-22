using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Workflow.Stages;

public interface IGovernanceWorkflowPromotePersistStage
{
    Task<GovernancePromotionRecord> PersistAsync(
        GovernanceWorkflowPromoteValidatedContext validated,
        CancellationToken cancellationToken);
}
