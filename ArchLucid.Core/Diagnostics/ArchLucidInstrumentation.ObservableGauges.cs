using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Observable gauge registration for outbox depths, fleet health, circuit breakers, LLM budgets, executive ROI, and
///     warm-catalog pool depth.
/// </summary>
/// <remarks>
///     Instrument field declarations remain in <c>ArchLucidInstrumentation.cs</c>; this partial owns one-shot gauge
///     registration and the reader delegates supplied by hosted collectors.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    private static int _outboxObservableGaugesRegistered;

    private static int _staleInFlightRunObservableGaugesRegistered;

    private static int _circuitBreakerStateObservableGaugeRegistered;

    private static int _llmTenantBudgetUtilizationObservableGaugeRegistered;

    private static int _llmTenantBudgetRemainingObservableGaugeRegistered;

    private static int _executiveRoiSavingsObservableGaugeRegistered;

    private static long _warmCatalogsAvailableCached;

    private static int _warmCatalogsAvailableObservableGaugeRegistered;

    private static Func<long>? _auditRetryQueuePendingReader;

    private static Func<IReadOnlyList<(string GateName, string State)>>? _circuitBreakerSnapshotReader;

    private static Func<Measurement<double>[]>? _llmBudgetUtilizationReader;

    private static Func<Measurement<double>[]>? _llmBudgetRemainingReader;

    private static Func<Measurement<double>[]>? _executiveRoiSavingsReader;

    /// <summary>Latest outbox depths for <see cref="EnsureOutboxDepthObservableGaugesRegistered" />.</summary>
    public static OutboxDepthGaugeState OutboxDepthGauges
    {
        get;
    } = new();

    /// <summary>Latest fleet-wide stale in-flight run gauges for <see cref="EnsureStaleInFlightRunObservableGaugesRegistered" /> (TB-958).</summary>
    public static StaleInFlightRunGaugeState StaleInFlightRunGauges
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

    public static void SetCircuitBreakerSnapshotReader(Func<IReadOnlyList<(string GateName, string State)>> reader) =>
        Volatile.Write(ref _circuitBreakerSnapshotReader, reader);

    public static void SetLlmBudgetUtilizationReader(Func<Measurement<double>[]> reader) =>
        Volatile.Write(ref _llmBudgetUtilizationReader, reader);

    public static void SetLlmBudgetRemainingReader(Func<Measurement<double>[]> reader) =>
        Volatile.Write(ref _llmBudgetRemainingReader, reader);

    public static void SetExecutiveRoiSavingsReader(Func<Measurement<double>[]> reader) =>
        Volatile.Write(ref _executiveRoiSavingsReader, reader);

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

    /// <summary>
    /// Registers fleet-wide stale in-flight run gauges once (TB-958). No <c>tenant_id</c> labels —
    /// tenant/run triage is log-only via <c>StaleInFlightRunMetricsHostedService</c>.
    /// </summary>
    public static void EnsureStaleInFlightRunObservableGaugesRegistered()
    {
        if (Interlocked.Exchange(ref _staleInFlightRunObservableGaugesRegistered, 1) != 0)
            return;

        StaleInFlightRunGaugeState s = StaleInFlightRunGauges;

        AppMeter.CreateObservableGauge(
            "archlucid_runs_stale_in_flight_count",
            () => new Measurement<long>(s.Current.StaleInFlightCount),
            description:
            "Non-archived runs stuck in Created/TasksGenerated/WaitingForResults/Retrying for more than 1 hour (fleet-wide; no tenant label).");

        AppMeter.CreateObservableGauge(
            "archlucid_runs_stale_in_flight_oldest_age_seconds",
            () => new Measurement<double>(s.Current.OldestStaleAgeSeconds),
            "s",
            "Age in seconds of the oldest stale in-flight run (fleet-wide; no tenant label).");
    }

    /// <summary>
    ///     Registers per-gauge circuit breaker state once (numeric: Closed=0, HalfOpen=1, Open=2; labels <c>gate</c>,
    ///     <c>state</c>).
    /// </summary>
    public static void EnsureCircuitBreakerStateObservableGaugesRegistered()
    {
        if (Interlocked.Exchange(ref _circuitBreakerStateObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_circuit_breaker_state",
            static () =>
            {
                IReadOnlyList<(string GateName, string State)> snaps = _circuitBreakerSnapshotReader?.Invoke() ?? Array.Empty<(string, string)>();
                Measurement<int>[] measurements = new Measurement<int>[snaps.Count];

                for (int i = 0; i < snaps.Count; i++)
                {
                    (string gateName, string state) = snaps[i];
                    int n = state switch
                    {
                        "Open" => 2,
                        "HalfOpen" => 1,
                        _ => 0
                    };
                    measurements[i] = new Measurement<int>(
                        n,
                        new KeyValuePair<string, object?>("gate", gateName),
                        new KeyValuePair<string, object?>("state", state));
                }

                return measurements;
            },
            description:
            "Circuit breaker state per gate (0=Closed,1=HalfOpen,2=Open) with string state tag (OpenAI gates).");
    }

    /// <summary>Registers observable per-tenant UTC-month LLM budget utilization fractions (collector updates snapshots on a ≥5 min cadence).</summary>
    public static void EnsureLlmTenantBudgetUtilizationObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _llmTenantBudgetUtilizationObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_budget_utilization_fraction",
            () => _llmBudgetUtilizationReader?.Invoke() ?? Array.Empty<Measurement<double>>(),
            description:
            "UTC-month LLM dollar utilization (CommittedUsd+ReservedUsd over configured hard cutoff + purchased bump; label tenant_id).");
    }

    /// <summary>Registers observable per-tenant UTC-month LLM budget USD remaining under the effective hard cap (collector updates alongside utilization).</summary>
    public static void EnsureLlmTenantBudgetRemainingUsdObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _llmTenantBudgetRemainingObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_budget_remaining_usd",
            () => _llmBudgetRemainingReader?.Invoke() ?? Array.Empty<Measurement<double>>(),
            "USD",
            "UTC-month LLM dollar headroom remaining under hard cutoff + purchased bump (non-negative; label tenant_id).");
    }

    /// <summary>Registers observable executive ROI savings gauge (platform aggregate + optional per-tenant rows).</summary>
    public static void EnsureExecutiveRoiSavingsObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _executiveRoiSavingsObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_tenant_estimated_savings_usd",
            () => _executiveRoiSavingsReader?.Invoke() ?? Array.Empty<Measurement<double>>(),
            "USD",
            "Estimated USD savings rollup from Executive ROI dedup rules. Labels: scope=platform|tenant; tenant_id when scope=tenant.");
    }

    /// <summary>Registers warm tenant catalog pool depth gauge once (leader-elected replenish worker publishes counts).</summary>
    public static void EnsureWarmCatalogsAvailableObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _warmCatalogsAvailableObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid.tenancy.warm_catalogs_available",
            () => new Measurement<long>(Volatile.Read(ref _warmCatalogsAvailableCached)),
            description:
            "Unclaimed warm tenant SQL catalogs ready for trial signup (SystemWithPerTenantCatalogs topology only).");
    }

    /// <summary>Updates the cached value read by <c>archlucid.tenancy.warm_catalogs_available</c>.</summary>
    public static void PublishWarmCatalogsAvailable(long count)
    {
        if (count < 0)

            count = 0;

        Volatile.Write(ref _warmCatalogsAvailableCached, count);
    }
}
