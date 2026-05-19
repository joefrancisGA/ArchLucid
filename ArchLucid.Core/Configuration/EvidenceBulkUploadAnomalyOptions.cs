namespace ArchLucid.Core.Configuration;

/// <summary>
///     Statistical spike detection and temporary stricter throttling for bulk evidence uploads.
/// </summary>
public sealed class EvidenceBulkUploadAnomalyOptions
{
    public const string SectionPath = "RateLimiting:EvidenceBulkUpload:Anomaly";

    /// <summary>When false, upload history is not tracked and stricter throttling is not applied.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Minutes of per-minute history retained for baseline mean and standard deviation.</summary>
    public int BaselineWindowMinutes { get; set; } = 60;

    /// <summary>Minutes of recent activity compared against the baseline.</summary>
    public int ObservationWindowMinutes { get; set; } = 5;

    /// <summary>Minimum baseline minute buckets required before spike detection runs.</summary>
    public int MinBaselineMinuteBuckets { get; set; } = 10;

    /// <summary>Minimum requests in the observation window before a spike can be flagged.</summary>
    public int MinRequestsInObservationWindow { get; set; } = 3;

    /// <summary>Z-score threshold applied to the observation-window request sum.</summary>
    public double ZScoreThreshold { get; set; } = 3.0;

    /// <summary>
    ///     When baseline per-minute standard deviation is zero, flag when the observation sum exceeds
    ///     <c>mean * ObservationWindowMinutes * FallbackSpikeMultiplier</c>.
    /// </summary>
    public double FallbackSpikeMultiplier { get; set; } = 3.0;

    /// <summary>How long stricter rate limits apply after an anomaly is detected.</summary>
    public int ThrottleDurationMinutes { get; set; } = 15;

    /// <summary>
    ///     Multiplier applied to the configured <c>evidenceBulkUpload</c> permit limit while throttled (e.g. 0.25 → 25%).
    /// </summary>
    public double StricterPermitLimitMultiplier { get; set; } = 0.25;
}
