using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Host.Core.Coordination;

/// <summary>
///     Shared exponential backoff and dead-letter threshold logic for recoverable outbox processors (TB-920).
/// </summary>
public static class OutboxProcessorRetryCalculator
{
    public static bool RetriesExhaustedAfterThisFailure(int attemptCount, int maxAttemptsBeforeDeadLetter)
    {
        int max = maxAttemptsBeforeDeadLetter <= 1 ? 1 : maxAttemptsBeforeDeadLetter;
        long attemptAfterPersist = attemptCount + 1L;

        return attemptAfterPersist >= max;
    }

    public static TimeSpan RetryDelayAfterFailure(int attemptCount, IOutboxLeaseRetryProcessorOptions opts)
    {
        ArgumentNullException.ThrowIfNull(opts);

        int floor = opts.RetryBackoffBaseSeconds < 1 ? 1 : opts.RetryBackoffBaseSeconds;
        int cap = opts.RetryBackoffMaxSeconds < floor ? floor : opts.RetryBackoffMaxSeconds;
        double scaled = floor * Math.Pow(2, attemptCount);
        double clamped = scaled > cap ? cap : scaled;
        double secondsRounded = clamped <= 1 ? 1 : Math.Ceiling(clamped);

        return TimeSpan.FromSeconds(secondsRounded);
    }
}
