using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Workflow.Stages;

public sealed class GovernanceWorkflowPromoteValidatedContext
{
    public required string PersistedRunId { get; init; }
    public required string ManifestVersion { get; init; }
    public required string SourceEnvironment { get; init; }
    public required string TargetEnvironment { get; init; }
    public required string PromotedBy { get; init; }
    public required GovernancePromotionRecord Record { get; init; }
    public GovernanceApprovalRequest? ProdApprovalToMarkPromoted { get; init; }
    public bool DryRun { get; init; }
}
