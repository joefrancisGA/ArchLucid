namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureDefenderFollowOnCollectResult
{
    public IReadOnlyList<HostedAzureArmDefenderGovernanceRecord> GovernanceAssignments { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderComplianceStandardRecord> ComplianceStandards { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderComplianceControlRecord> ComplianceControls { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderAlertRecord> Alerts { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderAttackPathRecord> AttackPaths { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderVulnerabilityCountRecord> VulnerabilityCounts { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderVulnerabilityFindingRecord> VulnerabilityFindings { get; init; } = [];

    public IReadOnlyList<string> Warnings { get; init; } = [];
}
