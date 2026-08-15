namespace ArchLucid.Host.Core.Coordination;

/// <summary>
///     Shared option clamping for recoverable outbox processors (TB-920).
/// </summary>
public static class OutboxProcessorOptionsVerifier
{
    public static (int LeaseDurationSeconds, int MaxAttemptsBeforeDeadLetter, int RetryBackoffBaseSeconds, int RetryBackoffMaxSeconds, int MaxConcurrentBatchEntries) NormalizeParallelLeaseRetry(
        int leaseDurationSeconds,
        int maxAttemptsBeforeDeadLetter,
        int retryBackoffBaseSeconds,
        int retryBackoffMaxSeconds,
        int maxConcurrentBatchEntries,
        int maxBatch = 25,
        int minLeaseDurationSeconds = 300)
    {
        int lease = ClampInt(leaseDurationSeconds, minLeaseDurationSeconds, 7200);
        int maxAttempts = ClampInt(maxAttemptsBeforeDeadLetter, 1, 999);
        int baseSecs = ClampInt(retryBackoffBaseSeconds, 1, 86_400);
        int maxSecs = ClampInt(retryBackoffMaxSeconds, 1, 86_400 * 7);
        int maxConcurrent = ClampInt(maxConcurrentBatchEntries, 1, maxBatch);

        if (maxSecs < baseSecs)
            maxSecs = baseSecs;

        return (lease, maxAttempts, baseSecs, maxSecs, maxConcurrent);
    }

    public static int ClampInt(int value, int min, int max)
    {
        if (value < min)
            return min;

        if (value > max)
            return max;

        return value;
    }
}
