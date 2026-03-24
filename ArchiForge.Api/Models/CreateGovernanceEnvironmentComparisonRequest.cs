namespace ArchiForge.Api.Models;

public sealed class CreateGovernanceEnvironmentComparisonRequest
{
    public string SourceEnvironment { get; set; } = "dev";
    public string TargetEnvironment { get; set; } = "test";
}
