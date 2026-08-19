using ArchLucid.Persistence.BlobStore;

namespace ArchLucid.Host.Core.Configuration;

/// <summary>Background export jobs: in-process channel vs durable SQL + Azure Storage Queue + worker.</summary>
public sealed class BackgroundJobsOptions
{
    public const string SectionName = "BackgroundJobs";

    /// <summary><c>InMemory</c> (default) or <c>Durable</c>.</summary>
    public string Mode
    {
        get;
        set;
    } = "InMemory";

    public string QueueName
    {
        get;
        set;
    } = "archlucid-export-jobs";

    /// <summary>Queue service URI, e.g. <c>https://{account}.queue.core.windows.net</c>. When empty, derived from <see cref="ArtifactLargePayloadOptions.AzureBlobServiceUri"/>.</summary>
    public string? QueueServiceUri
    {
        get;
        set;
    }

    public string ResultsContainerName
    {
        get;
        set;
    } = "background-job-results";

    public int MaxPendingJobs
    {
        get;
        set;
    } = 500;

    public int ProcessorVisibilityMinutes
    {
        get;
        set;
    } = 15;

    public int ProcessorIdlePollMilliseconds
    {
        get;
        set;
    } = 750;

    /// <summary>
    ///     Optional ceiling for adaptive idle backoff when the queue is empty (milliseconds).
    ///     When unset, uses a 10 s ceiling (same as outbox adaptive idle max).
    /// </summary>
    public int? ProcessorMaxIdlePollMilliseconds
    {
        get;
        set;
    }

    /// <summary>Azure Storage Queue receive batch size per poll (1–32). Larger batches improve throughput when multiple workers scale out.</summary>
    public int ProcessorReceiveBatchSize
    {
        get;
        set;
    } = 16;

    /// <summary>
    ///     Jobs executed concurrently within one received batch (1–16). Each job already runs in its own
    ///     DI scope; the bound protects the SQL pool and blob throughput on a single worker replica.
    /// </summary>
    public int ProcessorMaxConcurrentJobs
    {
        get;
        set;
    } = 4;
}
