using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Integration-event delivery and outbox telemetry recording.
/// </summary>
/// <remarks>
///     Instrument field declarations for this subsystem live in this partial.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    // Instrument catalog

    
    /// <summary>Digest channel send failed after non-cancellation error (labels: <c>channel</c>).</summary>
    public static readonly Counter<long> DigestDeliveryFailed = AppMeter.CreateCounter<long>("archlucid_digest_delivery_failed");

    
    /// <summary>Digest channel send succeeded (labels: <c>channel</c>).</summary>
    public static readonly Counter<long> DigestDeliverySucceeded =
        AppMeter.CreateCounter<long>("archlucid_digest_delivery_succeeded");

    
    /// <summary>Integration outbox publish attempt failed (label <c>event_type</c>; row may retry or dead-letter).</summary>
    public static readonly Counter<long> IntegrationEventDeliveryFailedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_integration_event_delivery_failed_total",
            description: "Integration event outbox publish failures (label event_type).");

    
    /// <summary>Integration outbox Service Bus publish succeeded (label <c>event_type</c> low-cardinality literal).</summary>
    public static readonly Counter<long> IntegrationEventDeliverySuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_integration_event_delivery_success_total",
            description: "Integration event outbox rows published to Service Bus successfully (label event_type).");

    
    /// <summary>Integration outbox dead-letter rows skipped after exhausting automatic DLQ requeue attempts.</summary>
    public static readonly Counter<long> IntegrationEventDlqPermanentFailureTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_integration_event_dlq_permanent_failure_total",
            description:
            "Integration outbox dead-letter rows that exceeded automatic DLQ requeue retry budget.");

    
    /// <summary>Post-commit projection outbox rows moved to dead-letter state.</summary>
    public static readonly Counter<long> PostCommitProjectionOutboxDeadLetteredTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_post_commit_projection_outbox_dead_lettered_total",
            description: "Post-commit projection outbox rows dead-lettered after non-retryable failure or exhausted retries.");

    
    /// <summary>Post-commit projection outbox rows processed successfully (side effect completed or benign skip).</summary>
    public static readonly Counter<long> PostCommitProjectionOutboxProcessedSuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_post_commit_projection_outbox_processed_success_total",
            description: "Post-commit projection outbox rows marked processed without dead-letter.");

    
    /// <summary>Post-commit projection outbox transient failures scheduled for retry.</summary>
    public static readonly Counter<long> PostCommitProjectionOutboxRetryScheduledTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_post_commit_projection_outbox_retry_scheduled_total",
            description: "Post-commit projection outbox rows that recorded backoff after a processing failure.");

    
    /// <summary>Run-export blob push outbox rows moved to dead-letter state.</summary>
    public static readonly Counter<long> RunExportBlobPushOutboxDeadLetteredTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_run_export_blob_push_outbox_dead_lettered_total",
            description: "Run-export blob push outbox rows dead-lettered after non-retryable failure or exhausted retries.");

    
    /// <summary>Run-export blob push outbox rows processed successfully (blob pushed or benign skip).</summary>
    public static readonly Counter<long> RunExportBlobPushOutboxProcessedSuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_run_export_blob_push_outbox_processed_success_total",
            description: "Run-export blob push outbox rows marked processed without dead-letter.");

    
    /// <summary>Run-export blob push outbox transient failures scheduled for retry.</summary>
    public static readonly Counter<long> RunExportBlobPushOutboxRetryScheduledTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_run_export_blob_push_outbox_retry_scheduled_total",
            description: "Run-export blob push outbox rows that recorded backoff after a processing failure.");

    
    /// <summary>
    ///     Outbound HTTP webhook POST attempts (<c>IWebhookPoster</c>; labels <c>event_type</c>, <c>succeeded</c>=true|false).
    /// </summary>
    public static readonly Counter<long> WebhookDeliveries =
        AppMeter.CreateCounter<long>(
            "archlucid.webhook.deliveries",
            description:
            "Webhook HTTP deliveries (labels event_type low-cardinality literal, succeeded=true|false).");

    
    /// <summary>Wall-clock HTTP POST latency for webhook deliveries (ms; label <c>event_type</c>).</summary>
    public static readonly Histogram<double> WebhookDeliveryDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid.webhook.delivery_duration",
            "ms",
            "Outbound webhook HTTP POST attempt duration.");

    /// <summary>Increments <see cref="IntegrationEventDeliverySuccessTotal" />.</summary>
    public static void RecordIntegrationEventDeliverySuccess(string eventType)
    {
        string e = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim();
        IntegrationEventDeliverySuccessTotal.Add(1, new TagList { { "event_type", e } });
    }

    /// <summary>Increments <see cref="IntegrationEventDeliveryFailedTotal" />.</summary>
    public static void RecordIntegrationEventDeliveryFailure(string eventType)
    {
        string e = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim();
        IntegrationEventDeliveryFailedTotal.Add(1, new TagList { { "event_type", e } });
    }

    /// <summary>Increments <see cref="RunExportBlobPushOutboxProcessedSuccessTotal" />.</summary>
    public static void RecordRunExportBlobPushOutboxProcessedSuccess()
    {
        RunExportBlobPushOutboxProcessedSuccessTotal.Add(1);
    }

    /// <summary>Increments <see cref="RunExportBlobPushOutboxRetryScheduledTotal" />.</summary>
    public static void RecordRunExportBlobPushOutboxRetryScheduled()
    {
        RunExportBlobPushOutboxRetryScheduledTotal.Add(1);
    }

    /// <summary>Increments <see cref="RunExportBlobPushOutboxDeadLetteredTotal" />.</summary>
    public static void RecordRunExportBlobPushOutboxDeadLettered()
    {
        RunExportBlobPushOutboxDeadLetteredTotal.Add(1);
    }

    /// <summary>Increments <see cref="PostCommitProjectionOutboxProcessedSuccessTotal" />.</summary>
    public static void RecordPostCommitProjectionOutboxProcessedSuccess()
    {
        PostCommitProjectionOutboxProcessedSuccessTotal.Add(1);
    }

    /// <summary>Increments <see cref="PostCommitProjectionOutboxRetryScheduledTotal" />.</summary>
    public static void RecordPostCommitProjectionOutboxRetryScheduled()
    {
        PostCommitProjectionOutboxRetryScheduledTotal.Add(1);
    }

    /// <summary>Increments <see cref="PostCommitProjectionOutboxDeadLetteredTotal" />.</summary>
    public static void RecordPostCommitProjectionOutboxDeadLettered()
    {
        PostCommitProjectionOutboxDeadLetteredTotal.Add(1);
    }

    /// <summary>Records permanently failed integration outbox DLQ rows observed in one auto-retry pass.</summary>
    public static void RecordIntegrationEventDlqPermanentFailures(long count)
    {
        if (count <= 0)
            return;

        IntegrationEventDlqPermanentFailureTotal.Add(count);
    }
}
