namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Effective governance environment ladder and allowed transitions for the current scope.
/// </summary>
public sealed class GovernanceEnvironmentCatalog
{
    /// <summary>
    ///     <see langword="true" /> when an administrator explicitly saved a catalog for this scope.
    ///     Unconfigured scopes may still return built-in defaults for display without persisting them.
    /// </summary>
    public bool IsAdministratorConfigured { get; set; }

    public IReadOnlyList<GovernanceEnvironmentDefinition> Environments { get; set; } =
        Array.Empty<GovernanceEnvironmentDefinition>();

    public IReadOnlyList<GovernanceEnvironmentTransition> Transitions { get; set; } =
        Array.Empty<GovernanceEnvironmentTransition>();
}
