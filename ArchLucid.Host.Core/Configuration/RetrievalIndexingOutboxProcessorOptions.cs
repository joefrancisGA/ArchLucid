namespace ArchLucid.Host.Core.Configuration;

/// <summary>
///     Background worker knobs for retrieval indexing SQL outbox rows (lease time, backoff, dead-letter).
/// </summary>
public sealed class RetrievalIndexingOutboxProcessorOptions
{
    public const string SectionName = "RetrievalIndexingOutbox";

    /// <summary>Exclusive lease per claimed outbox row to prevent duplicate concurrent indexing.</summary>
    public int LeaseDurationSeconds
    {
        get;
        set;
    } = 300;

    /// <summary>Inclusive failures after dequeue before the row moves to dead-letter state.</summary>
    public int MaxAttemptsBeforeDeadLetter
    {
        get;
        set;
    } = 48;

    /// <summary>Backoff floor (seconds): first retry uses this value before exponential growth.</summary>
    public int RetryBackoffBaseSeconds
    {
        get;
        set;
    } = 10;

    /// <summary>Maximum delay (seconds) between retries.</summary>
    public int RetryBackoffMaxSeconds
    {
        get;
        set;
    } = 900;
}
