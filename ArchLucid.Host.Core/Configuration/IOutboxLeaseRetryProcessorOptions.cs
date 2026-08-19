namespace ArchLucid.Host.Core.Configuration;

/// <summary>
///     Lease, retry backoff, and dead-letter knobs shared by recoverable outbox processors (TB-920).
/// </summary>
public interface IOutboxLeaseRetryProcessorOptions
{
    int LeaseDurationSeconds
    {
        get;
    }

    int MaxAttemptsBeforeDeadLetter
    {
        get;
    }

    int RetryBackoffBaseSeconds
    {
        get;
    }

    int RetryBackoffMaxSeconds
    {
        get;
    }
}
