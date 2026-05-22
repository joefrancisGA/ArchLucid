namespace ArchLucid.Api.Models.Pilots;

/// <summary>JSON scorecard returned to sponsors and finance (MVP fields).</summary>
public sealed class PilotScorecardResponse
{
    public Guid TenantId
    {
        get;
        set;
    }

    public DateTimeOffset PeriodStart
    {
        get;
        set;
    }

    public DateTimeOffset PeriodEnd
    {
        get;
        set;
    }

    public int RunsInPeriod
    {
        get;
        set;
    }

    public int RunsWithCommittedManifest
    {
        get;
        set;
    }

    /// <summary>Latest Azure extractor package collection timestamp in scope (pricing baseline citation).</summary>
    public DateTime? ExtractorCollectionTimestampUtc
    {
        get;
        set;
    }

    /// <summary>Last submitted hours saved (from POST body when provided).</summary>
    public decimal? HoursSaved
    {
        get;
        set;
    }

    /// <summary>Last submitted risks mitigated count (from POST body when provided).</summary>
    public int? RisksMitigated
    {
        get;
        set;
    }

    /// <summary>Last submitted qualitative notes (from POST body when provided).</summary>
    public string? QualitativeNotes
    {
        get;
        set;
    }
}
