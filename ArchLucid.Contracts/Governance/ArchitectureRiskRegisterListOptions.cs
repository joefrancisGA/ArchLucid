namespace ArchLucid.Contracts.Governance;

/// <summary>Server-side filters for the architecture risk register (TB-2195 assigned-to-me queue).</summary>
public sealed class ArchitectureRiskRegisterListOptions
{
    /// <summary>Case-insensitive match against <c>FindingRecords.AssignedToUserId</c>; empty means no assignee filter.</summary>
    public IReadOnlyList<string> AssignedToUserIds
    {
        get;
        init;
    } = [];

    /// <summary>When true, excludes findings dispositioned as remediated or rejected-as-not-applicable.</summary>
    public bool OpenFindingsOnly
    {
        get;
        init;
    }
}
