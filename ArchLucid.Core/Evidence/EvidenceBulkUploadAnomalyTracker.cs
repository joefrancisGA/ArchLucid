using System.Collections.Concurrent;

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Evidence;

/// <summary>
///     In-process per-partition upload history with z-score spike detection and temporary stricter throttling.
/// </summary>
public sealed class EvidenceBulkUploadAnomalyTracker(
    IOptionsMonitor<EvidenceBulkUploadAnomalyOptions> optionsMonitor,
    TimeProvider timeProvider)
    : IEvidenceBulkUploadAnomalyTracker
{
    private readonly IOptionsMonitor<EvidenceBulkUploadAnomalyOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ConcurrentDictionary<string, PartitionState> _partitions = new();

    public bool RecordAndEvaluate(string partitionKey, int fileCount)
    {
        if (string.IsNullOrWhiteSpace(partitionKey))
            return false;

        EvidenceBulkUploadAnomalyOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return false;

        PartitionState state = _partitions.GetOrAdd(partitionKey, static _ => new PartitionState());
        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;
        DateTime minuteStart = TruncateToMinute(utcNow);

        lock (state.Sync)
        {
            PruneExpiredThrottleLocked(state, utcNow);
            IncrementMinuteBucketLocked(state, minuteStart, fileCount);
            PruneOldBucketsLocked(state, utcNow, opts);

            if (!TryDetectSpikeLocked(state, utcNow, opts, out double observed, out double threshold))
                return false;

            TimeSpan throttleDuration = TimeSpan.FromMinutes(Math.Clamp(opts.ThrottleDurationMinutes, 1, 1440));
            state.ThrottleUntilUtc = utcNow.Add(throttleDuration);
            state.LastAnomalyObservedRequests = observed;
            state.LastAnomalyThresholdRequests = threshold;

            return true;
        }
    }

    public bool IsThrottled(string partitionKey)
    {
        if (string.IsNullOrWhiteSpace(partitionKey))
            return false;

        EvidenceBulkUploadAnomalyOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return false;

        if (!_partitions.TryGetValue(partitionKey, out PartitionState? state))
            return false;

        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;

        lock (state.Sync)
        {
            PruneExpiredThrottleLocked(state, utcNow);

            return state.ThrottleUntilUtc is not null;
        }
    }

    public double GetPermitLimitMultiplier(string partitionKey)
    {
        if (!IsThrottled(partitionKey))
            return 1.0;

        EvidenceBulkUploadAnomalyOptions opts = _optionsMonitor.CurrentValue;

        return Math.Clamp(opts.StricterPermitLimitMultiplier, 0.05, 1.0);
    }

    private static DateTime TruncateToMinute(DateTime utc)
    {
        return new DateTime(utc.Year, utc.Month, utc.Day, utc.Hour, utc.Minute, 0, DateTimeKind.Utc);
    }

    private static void IncrementMinuteBucketLocked(PartitionState state, DateTime minuteStart, int fileCount)
    {
        if (state.MinuteBuckets.Count > 0 && state.MinuteBuckets[^1].MinuteStartUtc == minuteStart)
        {
            MinuteBucket bucket = state.MinuteBuckets[^1];
            state.MinuteBuckets[^1] = bucket with
            {
                RequestCount = bucket.RequestCount + 1,
                FileCount = bucket.FileCount + Math.Max(0, fileCount)
            };

            return;
        }

        state.MinuteBuckets.Add(new MinuteBucket(minuteStart, 1, Math.Max(0, fileCount)));
    }

    private static void PruneOldBucketsLocked(
        PartitionState state,
        DateTime utcNow,
        EvidenceBulkUploadAnomalyOptions opts)
    {
        int retainMinutes = Math.Clamp(opts.BaselineWindowMinutes, 5, 1440);
        DateTime cutoff = utcNow.AddMinutes(-retainMinutes);

        while (state.MinuteBuckets.Count > 0 && state.MinuteBuckets[0].MinuteStartUtc < cutoff)
            state.MinuteBuckets.RemoveAt(0);
    }

    private static void PruneExpiredThrottleLocked(PartitionState state, DateTime utcNow)
    {
        if (state.ThrottleUntilUtc is { } until && until <= utcNow)
            state.ThrottleUntilUtc = null;
    }

    private static bool TryDetectSpikeLocked(
        PartitionState state,
        DateTime utcNow,
        EvidenceBulkUploadAnomalyOptions opts,
        out double observedRequests,
        out double thresholdRequests)
    {
        observedRequests = 0;
        thresholdRequests = 0;

        int observationMinutes = Math.Clamp(opts.ObservationWindowMinutes, 1, 60);
        int minBaselineBuckets = Math.Max(1, opts.MinBaselineMinuteBuckets);
        int minObservationRequests = Math.Max(1, opts.MinRequestsInObservationWindow);
        DateTime observationStart = utcNow.AddMinutes(-observationMinutes);

        List<int> baselinePerMinute = [];
        int observationSum = 0;

        foreach (MinuteBucket bucket in state.MinuteBuckets)
        {
            if (bucket.MinuteStartUtc >= observationStart)
            {
                observationSum += bucket.RequestCount;

                continue;
            }

            baselinePerMinute.Add(bucket.RequestCount);
        }

        observedRequests = observationSum;

        if (observationSum < minObservationRequests)
            return false;

        if (baselinePerMinute.Count < minBaselineBuckets)
            return false;

        double mean = baselinePerMinute.Average();
        double variance = baselinePerMinute.Select(v => Math.Pow(v - mean, 2)).Average();
        double stdDev = Math.Sqrt(variance);
        double z = Math.Max(1.0, opts.ZScoreThreshold);
        int n = observationMinutes;

        if (stdDev < double.Epsilon)
        {
            double fallbackMult = Math.Max(1.0, opts.FallbackSpikeMultiplier);
            thresholdRequests = mean > double.Epsilon
                ? mean * n * fallbackMult
                : minObservationRequests;

            return observationSum > thresholdRequests;
        }

        thresholdRequests = mean * n + z * stdDev * Math.Sqrt(n);

        return observationSum > thresholdRequests;
    }

    private sealed class PartitionState
    {
        public object Sync { get; } = new();

        public List<MinuteBucket> MinuteBuckets { get; } = [];

        public DateTime? ThrottleUntilUtc { get; set; }

        public double LastAnomalyObservedRequests { get; set; }

        public double LastAnomalyThresholdRequests { get; set; }
    }

    private readonly record struct MinuteBucket(DateTime MinuteStartUtc, int RequestCount, int FileCount);
}
