using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings.Payloads;

/// <summary>DX-22: synthesis finding that groups demoted checklist rows sharing a root cause.</summary>
public sealed class ChecklistClusterSynthesisFindingPayload
{
    private IReadOnlyList<string> memberFindingIds = [];

    public IReadOnlyList<string> MemberFindingIds
    {
        get => memberFindingIds;
        set => memberFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public string ClusterKey
    {
        get;
        set;
    } = null!;

    public int MemberCount
    {
        get;
        set;
    }
}
