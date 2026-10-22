using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>Architecture risk register payload (TB-057).</summary>
public sealed class ArchitectureRiskRegisterResponse
{
    private IReadOnlyList<ArchitectureRiskRegisterEntry> entries = [];

    public IReadOnlyList<ArchitectureRiskRegisterEntry> Entries
    {
        get => entries;
        init => entries = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
