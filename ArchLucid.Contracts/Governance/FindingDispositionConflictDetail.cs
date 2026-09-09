using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Governance;

/// <summary>Server truth returned on finding disposition concurrency conflict (ADR 0076).</summary>
public sealed class FindingDispositionConflictDetail
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

    public DateTimeOffset OccurredAtUtc
    {
        get;
        init;
    }

    public string CurrentDispositionRowVersionBase64
    {
        get;
        init;
    } = string.Empty;
}
