namespace ArchLucid.Host.Core.Configuration;

/// <summary>
/// In-memory ring buffer for comparison replay diagnostics (<see cref="Services.IReplayDiagnosticsRecorder"/>).
/// </summary>
public sealed class ReplayDiagnosticsOptions
{
    public const string SectionName = "ReplayDiagnostics";

    /// <summary>Maximum entries retained (clamped to 1–50000; invalid values default to 100).</summary>
    public int MaxRetainedRecords
    {
        get;
        set;
    } = 100;

    /// <summary>Legacy configuration binding alias for <see cref="MaxRetainedRecords"/>.</summary>
    public int Capacity
    {
        get => MaxRetainedRecords;
        set => MaxRetainedRecords = value;
    }

    /// <summary>
    /// Entries older than this many minutes are evicted from the front of the queue on each <see cref="Services.IReplayDiagnosticsRecorder.Record"/>.
    /// <c>0</c> disables time-based eviction (capacity-only trimming).
    /// </summary>
    public int RetentionMinutes
    {
        get;
        set;
    } = 1440;
}
