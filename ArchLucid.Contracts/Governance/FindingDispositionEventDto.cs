using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Governance;

/// <summary>One durable disposition event for API responses.</summary>
public sealed class FindingDispositionEventDto
{
    public Guid EventId
    {
        get;
        init;
    }

    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public FindingDisposition Disposition
    {
        get;
        init;
    }

    public string ReviewerUserId
    {
        get;
        init;
    } = string.Empty;

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

    public DateTimeOffset OccurredAtUtc
    {
        get;
        init;
    }

    public Guid? RunId
    {
        get;
        init;
    }
}
