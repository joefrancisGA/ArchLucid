using ArchLucid.Persistence.IntegrationOutbox;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Backoff and eligibility rules for integration outbox DLQ auto-retry.</summary>
public static class IntegrationEventDlqRetryPolicy
{
    /// <summary>Maximum publish retry count on a dead-letter row before it is treated as permanently failed.</summary>
    public const int MaxAutoRetryCount = 5;

    /// <summary>Minimum delay after dead-letter before an automatic requeue attempt (first pass).</summary>
    public static readonly TimeSpan MinimumBackoff = TimeSpan.FromMinutes(1);

    /// <summary>Whether a dead-letter row is eligible for another automatic requeue attempt.</summary>
    public static bool IsEligibleForAutoRetry(IntegrationEventOutboxDeadLetterRow row, DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (IsPermanentlyFailed(row))
            return false;

        DateTime eligibleUtc = row.DeadLetteredUtc.Add(ComputeBackoff(row.RetryCount));

        return utcNow >= eligibleUtc;
    }

    /// <summary>Exponential backoff keyed off the row's retry count (minutes: 1, 2, 4, 8, … capped at 120).</summary>
    public static TimeSpan ComputeBackoff(int retryCount)
    {
        int exponent = Math.Clamp(retryCount, 0, 10);
        double minutes = Math.Pow(2, exponent);

        if (minutes < MinimumBackoff.TotalMinutes)
            minutes = MinimumBackoff.TotalMinutes;

        if (minutes > 120)
            minutes = 120;

        return TimeSpan.FromMinutes(minutes);
    }

    /// <summary>Rows at or above <see cref="MaxAutoRetryCount" /> require operator acknowledgement.</summary>
    public static bool IsPermanentlyFailed(IntegrationEventOutboxDeadLetterRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        return row.RetryCount >= MaxAutoRetryCount;
    }
}
