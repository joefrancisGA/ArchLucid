namespace ArchLucid.Core.Configuration;

/// <summary>Background purge of terminal Socratic intake drafts (ADR 0048).</summary>
public sealed class DraftIntakeReaperOptions
{
    public const string SectionName = "DraftIntakeReaper";

    /// <summary>When false, the reaper hosted loop does nothing.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Minimum wall-clock interval between reaper passes.</summary>
    public int IntervalHours
    {
        get;
        set;
    } = 24;

    /// <summary>
    ///     Redirected and Abandoned rows with <c>UpdatedUtc</c> older than this many days are hard-deleted.
    ///     Clamped to 1–365.
    /// </summary>
    public int TtlDays
    {
        get;
        set;
    } = 30;

    /// <summary>Rows deleted per batch call. Clamped to 1–10_000.</summary>
    public int BatchSize
    {
        get;
        set;
    } = 500;
}
