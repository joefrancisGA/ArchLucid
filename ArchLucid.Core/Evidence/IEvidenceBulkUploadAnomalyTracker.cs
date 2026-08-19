namespace ArchLucid.Core.Evidence;

/// <summary>
///     Tracks bulk evidence upload rates per tenant (or IP) partition and applies temporary stricter throttling on spikes.
/// </summary>
public interface IEvidenceBulkUploadAnomalyTracker
{
    /// <summary>
    ///     Records a bulk upload attempt and evaluates whether the partition exhibits an anomalous spike.
    /// </summary>
    /// <returns><c>true</c> when a new anomaly is detected on this call.</returns>
    bool RecordAndEvaluate(string partitionKey, int fileCount);

    /// <summary>Whether the partition is under stricter rate limiting after a recent anomaly.</summary>
    bool IsThrottled(string partitionKey);

    /// <summary>Multiplier for the configured rate-limit permit cap (1.0 or the configured stricter value).</summary>
    double GetPermitLimitMultiplier(string partitionKey);
}
