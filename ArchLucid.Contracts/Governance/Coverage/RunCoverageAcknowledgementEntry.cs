namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>One operator acknowledgement row pinned on a run before execute.</summary>
public sealed class RunCoverageAcknowledgementEntry
{
    public Guid PolicyPackId
    {
        get;
        set;
    }

    public bool Excluded
    {
        get;
        set;
    }

    public string? ExclusionReason
    {
        get;
        set;
    }
}
