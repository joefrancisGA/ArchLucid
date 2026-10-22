namespace ArchLucid.Core.Persistence.ApplicationPorts.Findings;

/// <summary>Raw SQL row for <see cref="IRunFindingExternalTrackingReadRepository" /> (TB-386).</summary>
public sealed class RunFindingExternalTrackingReadRow
{
    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public string? HumanReviewStatus
    {
        get;
        init;
    }

    public string? Disposition
    {
        get;
        init;
    }

    public DateTime? RevisitDueUtc
    {
        get;
        init;
    }

    public string? Provider
    {
        get;
        init;
    }

    public string? ExternalKey
    {
        get;
        init;
    }

    public string? ExternalSysId
    {
        get;
        init;
    }

    public string? ItsmLinkedTicketsSummary
    {
        get;
        init;
    }
}
