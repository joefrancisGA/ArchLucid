using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Observable gauge registration for outbox depths, fleet health, circuit breakers, LLM budgets, sponsor ROI, and
///     warm-catalog pool depth.
/// </summary>
/// <remarks>
///     Instrument field declarations for observable gauges live in partials on the shared <see cref="Meter" />;
///     each partial owns one-shot gauge registration and the reader delegates supplied by hosted collectors.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    private static int _outboxObservableGaugesRegistered;

    private static Func<long>? _auditRetryQueuePendingReader;

    /// <summary>Latest outbox depths for <see cref="EnsureOutboxDepthObservableGaugesRegistered" />.</summary>
    public static OutboxDepthGaugeState OutboxDepthGauges
    {
        get;
    } = new();

    /// <summary>
    ///     Supplies pending audit-retry depth for <c>archlucid_audit_retry_queue_pending</c> (last writer wins; use a
    ///     singleton queue).
    /// </summary>
    public static void SetAuditRetryQueuePendingReader(Func<long>? reader)
    {
        Volatile.Write(ref _auditRetryQueuePendingReader, reader);
    }

    /// <summary>Registers observable gauges once (call from OpenTelemetry host setup).</summary>
    public static void EnsureOutboxDepthObservableGaugesRegistered()
    {
        if (Interlocked.Exchange(ref _outboxObservableGaugesRegistered, 1) != 0)
            return;

        OutboxDepthGaugeState s = OutboxDepthGauges;

        AppMeter.CreateObservableGauge(
            "archlucid_authority_pipeline_work_pending",
            () => new Measurement<long>(s.Current.AuthorityPipelineWorkPending),
            description:
            "dbo.AuthorityPipelineWorkOutbox rows eligible for dequeue (excludes dead letters, active leases, backoff window).");

        AppMeter.CreateObservableGauge(
            "archlucid_authority_pipeline_work_dead_letter",
            () => new Measurement<long>(s.Current.AuthorityPipelineWorkDeadLetter),
            description: "dbo.AuthorityPipelineWorkOutbox rows exhausted retries (DeadLetteredUtc set).");

        AppMeter.CreateObservableGauge(
            "archlucid_authority_pipeline_work_oldest_pending_age_seconds",
            () => new Measurement<double>(s.Current.AuthorityPipelineWorkOldestPendingAgeSeconds),
            "s",
            "Age in seconds of the oldest pending authority pipeline work outbox row.");

        AppMeter.CreateObservableGauge(
            "archlucid_retrieval_indexing_outbox_pending",
            () => new Measurement<long>(s.Current.RetrievalIndexingOutboxPending),
            description: "Rows in dbo.RetrievalIndexingOutbox awaiting indexing.");

        AppMeter.CreateObservableGauge(
            "archlucid_retrieval_indexing_outbox_oldest_pending_age_seconds",
            () => new Measurement<double>(s.Current.RetrievalIndexingOutboxOldestPendingAgeSeconds),
            "s",
            "Age in seconds of the oldest pending retrieval indexing outbox row.");

        AppMeter.CreateObservableGauge(
            "archlucid_retrieval_indexing_outbox_dead_lettered_total",
            () => new Measurement<long>(s.Current.RetrievalIndexingOutboxDeadLetter),
            description: "dbo.RetrievalIndexingOutbox rows exhausted retries (DeadLetteredUtc set).");

        AppMeter.CreateObservableGauge(
            "archlucid_integration_event_outbox_publish_pending",
            () => new Measurement<long>(s.Current.IntegrationEventOutboxPublishPending),
            description: "Integration outbox rows eligible for Service Bus publish (excludes dead letters).");

        AppMeter.CreateObservableGauge(
            "archlucid_integration_event_outbox_dead_letter",
            () => new Measurement<long>(s.Current.IntegrationEventOutboxDeadLetter),
            description: "Integration outbox rows in dead-letter state.");

        AppMeter.CreateObservableGauge(
            "archlucid_integration_event_outbox_oldest_actionable_pending_age_seconds",
            () => new Measurement<double>(s.Current.IntegrationEventOutboxOldestActionablePendingAgeSeconds),
            "s",
            "Age in seconds of the oldest actionable integration outbox publish row.");

        AppMeter.CreateObservableGauge(
            "archlucid_run_export_blob_push_outbox_pending",
            () => new Measurement<long>(s.Current.RunExportBlobPushOutboxPending),
            description:
            "dbo.RunExportBlobPushOutbox rows eligible for dequeue (excludes dead letters, active leases, backoff window).");

        AppMeter.CreateObservableGauge(
            "archlucid_run_export_blob_push_outbox_oldest_pending_age_seconds",
            () => new Measurement<double>(s.Current.RunExportBlobPushOutboxOldestPendingAgeSeconds),
            "s",
            "Age in seconds of the oldest actionable run-export blob push outbox row.");

        AppMeter.CreateObservableGauge(
            "archlucid_run_export_blob_push_outbox_dead_letter",
            () => new Measurement<long>(s.Current.RunExportBlobPushOutboxDeadLetter),
            description: "dbo.RunExportBlobPushOutbox rows exhausted retries (DeadLetteredUtc set).");

        AppMeter.CreateObservableGauge(
            "archlucid_post_commit_projection_outbox_pending",
            () => new Measurement<long>(s.Current.PostCommitProjectionOutboxPending),
            description:
            "dbo.PostCommitProjectionOutbox rows eligible for dequeue (excludes dead letters, active leases, backoff window).");

        AppMeter.CreateObservableGauge(
            "archlucid_post_commit_projection_outbox_oldest_pending_age_seconds",
            () => new Measurement<double>(s.Current.PostCommitProjectionOutboxOldestPendingAgeSeconds),
            "s",
            "Age in seconds of the oldest actionable post-commit projection outbox row.");

        AppMeter.CreateObservableGauge(
            "archlucid_post_commit_projection_outbox_dead_letter",
            () => new Measurement<long>(s.Current.PostCommitProjectionOutboxDeadLetter),
            description: "dbo.PostCommitProjectionOutbox rows exhausted retries (DeadLetteredUtc set).");

        AppMeter.CreateObservableGauge(
            "archlucid_audit_retry_queue_pending",
            () => new Measurement<long>(_auditRetryQueuePendingReader?.Invoke() ?? 0),
            description: "Approximate audit events waiting in memory for durable write after hot-path failure.");
    }
}
