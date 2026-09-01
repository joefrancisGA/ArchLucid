namespace ArchLucid.Contracts.Drafts;

/// <summary>Lightweight list row for architecture intake drafts (server-backed inventory).</summary>
public sealed class DraftRequestSummaryResponse
{
    public Guid DraftId
    {
        get;
        set;
    }

    public DraftRequestStatus Status
    {
        get;
        set;
    }

    /// <summary>Projected <c>systemName</c> from the draft document when present.</summary>
    public string? SystemName
    {
        get;
        set;
    }

    /// <summary>Trimmed free-text intent preview for list display.</summary>
    public string FreeTextIntent
    {
        get;
        set;
    } = string.Empty;

    public string? SpawnedRunId
    {
        get;
        set;
    }

    public string CreatedByUserId
    {
        get;
        set;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime UpdatedUtc
    {
        get;
        set;
    }

    /// <summary>Whether TB-2282 review-start readiness passes for create-architecture drafts.</summary>
    public bool ReviewReadinessValid
    {
        get;
        set;
    }
}
