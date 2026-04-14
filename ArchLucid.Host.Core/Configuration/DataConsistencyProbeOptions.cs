namespace ArchLucid.Host.Core.Configuration;

/// <summary>Background probes for cross-table consistency (SQL only).</summary>
public sealed class DataConsistencyProbeOptions
{
    /// <summary>Configuration section (<c>DataConsistency</c>).</summary>
    public const string SectionName = "DataConsistency";

    /// <summary>When true, the API/worker periodically counts orphan coordinator rows and emits metrics (detection-only).</summary>
    public bool OrphanProbeEnabled { get; set; } = true;

    /// <summary>Interval between probe passes.</summary>
    public int OrphanProbeIntervalMinutes { get; set; } = 60;
}
