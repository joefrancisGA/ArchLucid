namespace ArchiForge.Contracts.Governance.Preview;

public sealed class GovernanceEnvironmentComparisonRequest
{
    public string SourceEnvironment { get; set; } = "dev";
    public string TargetEnvironment { get; set; } = "test";
}
