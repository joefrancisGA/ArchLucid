namespace ArchLucid.Contracts.User;

/// <summary>Per-user desk continuity for Working-mode resume (IS-13).</summary>
public sealed class DeskContinuityDto
{
    /// <summary>Last opened architecture identity id (Working locator — AO-48).</summary>
    public string? LastOpenArchitectureId
    {
        get;
        set;
    }

    /// <summary>Last opened architecture review package id.</summary>
    public string? LastOpenReviewId
    {
        get;
        set;
    }

    /// <summary>Last opened architecture draft id.</summary>
    public string? LastOpenDraftId
    {
        get;
        set;
    }

    /// <summary>UTC watermark for new-since-last-visit markers across the desk.</summary>
    public string? LastVisitWatermarkUtc
    {
        get;
        set;
    }
}
