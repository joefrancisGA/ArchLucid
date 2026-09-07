namespace ArchLucid.Contracts.Findings.Payloads;

/// <summary>DX-22: synthesis finding that groups demoted checklist rows sharing a root cause.</summary>
public sealed class ChecklistClusterSynthesisFindingPayload
{
    public IReadOnlyList<string> MemberFindingIds
    {
        get;
        set;
    } = [];

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
