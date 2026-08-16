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

    /// <summary>Explicit trade-off narrative required when disposition is Accepted (assessment item 51).</summary>
    public string? TradeOffAcknowledgment
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
