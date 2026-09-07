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

    /// <summary>Row version of <c>dbo.FindingCurrentDispositions</c> after this event became current (ADR 0076).</summary>
    public string? CurrentDispositionRowVersionBase64
    {
        get;
        init;
    }
}
