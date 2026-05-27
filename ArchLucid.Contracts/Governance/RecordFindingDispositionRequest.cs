using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Governance;

/// <summary>Request body for recording a finding disposition (TB-058).</summary>
public sealed class RecordFindingDispositionRequest
{
    public required string FindingId
    {
        get;
        init;
    }

    public Guid? RunId
    {
        get;
        init;
    }

    public required FindingDisposition Disposition
    {
        get;
        init;
    }

    public string? Rationale
    {
        get;
        init;
    }

    public DateTimeOffset? RevisitDueUtc
    {
        get;
        init;
    }

    public string? EvidenceRequestText
    {
        get;
        init;
    }
}
