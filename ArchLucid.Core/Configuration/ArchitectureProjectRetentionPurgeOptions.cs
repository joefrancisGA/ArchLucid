namespace ArchLucid.Core.Configuration;

/// <summary>Background hard-delete of soft-deleted <c>dbo.Projects</c> past <see cref="RetentionDays" />.</summary>
public sealed class ArchitectureProjectRetentionPurgeOptions
{
    public const string SectionName = "ArchitectureProjectRetention";

    /// <summary>When false, the hosted purge loop does nothing.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Minimum wall-clock interval between purge passes.</summary>
    public int IntervalHours
    {
        get;
        set;
    } = 24;

    /// <summary>Rows with <c>DeletedUtc</c> older than this many days are permanently deleted. Clamped to 1–365.</summary>
    public int RetentionDays
    {
        get;
        set;
    } = 30;
}
