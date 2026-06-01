using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Governance;

/// <summary>One architecture risk register row (TB-057).</summary>
public sealed class ArchitectureRiskRegisterEntry
{
    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public Guid? RunId
    {
        get;
        init;
    }

    public Guid? ManifestId
    {
        get;
        init;
    }

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string Severity
    {
        get;
        init;
    } = string.Empty;

    public string Category
    {
        get;
        init;
    } = string.Empty;

    public string StatusLabel
    {
        get;
        init;
    } = string.Empty;

    public string? OwnerUserId
    {
        get;
        init;
    }

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

    public DateTimeOffset? LastReviewedUtc
    {
        get;
        init;
    }

    public int AgingDays
    {
        get;
        init;
    }

    public DateTimeOffset? WaiverExpiresAtUtc
    {
        get;
        init;
    }

    public bool IsStale
    {
        get;
        init;
    }

    public string EvidenceHref
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Inbound ITSM sync / operator human review state from <c>dbo.FindingRecords.HumanReviewStatus</c>.</summary>
    public FindingHumanReviewStatus HumanReviewStatus
    {
        get;
        init;
    } = FindingHumanReviewStatus.NotRequired;

    /// <summary>
    /// Aggregated external ticket keys when <c>dbo.ItsmFindingCorrelations</c> rows exist (e.g. <c>Jira:PROJ-1; ServiceNow:INC001</c>).
    /// </summary>
    public string? ItsmLinkedTicketsSummary
    {
        get;
        init;
    }
}
