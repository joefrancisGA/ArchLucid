using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>Cross-review decision register (TB-060).</summary>
public sealed class ArchitectureDecisionRegisterResponse
{
    private IReadOnlyList<ArchitectureDecisionRegisterEntry> decisions = [];

    public IReadOnlyList<ArchitectureDecisionRegisterEntry> Decisions
    {
        get => decisions;
        init => decisions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
