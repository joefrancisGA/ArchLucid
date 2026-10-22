using ArchLucid.Contracts.Serialization;

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

    private IReadOnlyList<GovernanceEnvironmentDefinition> environments = [];

    public IReadOnlyList<GovernanceEnvironmentDefinition> Environments
    {
        get => environments;
        set => environments = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<GovernanceEnvironmentTransition> transitions = [];

    public IReadOnlyList<GovernanceEnvironmentTransition> Transitions
    {
        get => transitions;
        set => transitions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
