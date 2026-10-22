using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Core.InfraEvidence;

public sealed class AzureInventoryDefenderBandContextReadModel
{
    public string? SubscriptionId
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryDefenderSummaryReadModel> DefenderSummaries
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderAssessmentReadModel> DefenderAssessments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderScoreControlReadModel> DefenderScoreControls
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderResourceRefReadModel> Resources
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderAlertReadModel> DefenderAlerts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderAttackPathReadModel> DefenderAttackPaths
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderVulnerabilityCountReadModel> DefenderVulnerabilityCounts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderGovernanceAssignmentReadModel> DefenderGovernanceAssignments
    {
        get;
        init;
    } = [];
}
