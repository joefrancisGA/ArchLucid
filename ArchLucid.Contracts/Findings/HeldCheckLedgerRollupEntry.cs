using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>Ranked rollup of engines blocked by one missing input (DX-52).</summary>
public sealed class HeldCheckLedgerRollupEntry
{
    public HeldCheckInputCode InputCode
    {
        get;
        init;
    }

    public int EngineCount
    {
        get;
        init;
    }

    private IReadOnlyList<string> engineTypes = [];

    public IReadOnlyList<string> EngineTypes
    {
        get => engineTypes;
        init => engineTypes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
