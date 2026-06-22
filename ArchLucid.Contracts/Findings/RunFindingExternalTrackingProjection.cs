namespace ArchLucid.Contracts.Findings;

/// <summary>
///     ITSM linkage and governance disposition fields projected for run findings export and list read models (TB-386).
/// </summary>
public sealed class RunFindingExternalTrackingProjection
{
    public FindingHumanReviewStatus HumanReviewStatus
    {
        get;
        init;
    } = FindingHumanReviewStatus.NotRequired;

    public FindingDisposition? LatestDisposition
    {
        get;
        init;
    }

    public DateTimeOffset? RevisitDueUtc
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

    public string? ExternalUrl
    {
        get;
        init;
    }

    /// <summary>Semicolon-separated <c>Provider:ExternalKey</c> pairs when multiple correlations exist.</summary>
    public string? ItsmLinkedTicketsSummary
    {
        get;
        init;
    }

    /// <summary><see langword="true" /> when at least one ITSM correlation exists for the tenant + finding.</summary>
    public bool TrackedExternally
    {
        get;
        init;
    }

    /// <summary>Human-readable external ticket summary; mirrors <see cref="ItsmLinkedTicketsSummary" /> when tracked.</summary>
    public string? ExternalTrackingSummary
    {
        get;
        init;
    }
}
