namespace ArchLucid.Contracts.Findings;

/// <summary>GET response listing insight signals recorded by the current operator on one finding.</summary>
public sealed class FindingInsightSignalStatusResponse
{
    public IReadOnlyList<FindingInsightSignalKind> Kinds
    {
        get;
        init;
    } = [];
}
