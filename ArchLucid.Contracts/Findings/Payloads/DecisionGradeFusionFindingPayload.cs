using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings.Payloads;

/// <summary>DX-51: synthesis finding that joins Decision-grade rows sharing a graph node.</summary>
public sealed class DecisionGradeFusionFindingPayload
{
    private IReadOnlyList<string> constituentFindingIds = [];

    public IReadOnlyList<string> ConstituentFindingIds
    {
        get => constituentFindingIds;
        set => constituentFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> sharedNodeIds = [];

    public IReadOnlyList<string> SharedNodeIds
    {
        get => sharedNodeIds;
        set => sharedNodeIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> sourceEngineTypes = [];

    public IReadOnlyList<string> SourceEngineTypes
    {
        get => sourceEngineTypes;
        set => sourceEngineTypes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
