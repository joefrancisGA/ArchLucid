using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <summary>
///     Handles environment activation, including transactional deactivation of prior activations,
///     audit, and integration events.
/// </summary>
public interface IGovernanceWorkflowActivateStage
{
    Task<GovernanceEnvironmentActivation> ActivateAsync(
        string runId,
        string manifestVersion,
        string environment,
        string activatedBy,
        CancellationToken cancellationToken);
}
