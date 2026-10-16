using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>Replaces the entire governance environment catalog for the caller's scope.</summary>
public sealed class ReplaceGovernanceEnvironmentCatalogRequest
{
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
