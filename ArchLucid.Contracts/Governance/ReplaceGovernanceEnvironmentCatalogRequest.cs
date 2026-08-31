namespace ArchLucid.Contracts.Governance;

/// <summary>Replaces the entire governance environment catalog for the caller's scope.</summary>
public sealed class ReplaceGovernanceEnvironmentCatalogRequest
{
    public IReadOnlyList<GovernanceEnvironmentDefinition> Environments { get; set; } =
        Array.Empty<GovernanceEnvironmentDefinition>();

    public IReadOnlyList<GovernanceEnvironmentTransition> Transitions { get; set; } =
        Array.Empty<GovernanceEnvironmentTransition>();
}
