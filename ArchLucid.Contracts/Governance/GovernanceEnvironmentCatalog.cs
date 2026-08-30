namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Effective governance environment ladder and allowed transitions for the current scope.
/// </summary>
public sealed class GovernanceEnvironmentCatalog
{
    public IReadOnlyList<GovernanceEnvironmentDefinition> Environments { get; set; } =
        Array.Empty<GovernanceEnvironmentDefinition>();

    public IReadOnlyList<GovernanceEnvironmentTransition> Transitions { get; set; } =
        Array.Empty<GovernanceEnvironmentTransition>();
}
