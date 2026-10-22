using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>GET response listing insight signals recorded by the current operator on one finding.</summary>
public sealed class FindingInsightSignalStatusResponse
{
    private IReadOnlyList<FindingInsightSignalKind> kinds = [];

    public IReadOnlyList<FindingInsightSignalKind> Kinds
    {
        get => kinds;
        init => kinds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
