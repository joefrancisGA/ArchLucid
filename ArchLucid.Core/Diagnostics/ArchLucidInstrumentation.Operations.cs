using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Platform operations telemetry: startup config advisories, named-query latency gates, billing checkout, and
///     provenance snapshot counters.
/// </summary>
/// <remarks>
///     Instrument field declarations for this subsystem live in this partial.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    // Instrument catalog

    
    /// <summary>
    ///     Wall time for <c>EvaluateAndPersistAsync</c> (labels: <c>rule_kind</c> = <c>simple</c> | <c>composite</c>).
    /// </summary>
    public static readonly Histogram<double> AlertEvaluationDurationMilliseconds = AppMeter.CreateHistogram<double>(
        "archlucid_alert_evaluation_duration_ms",
        "ms",
        "Time spent in alert EvaluateAndPersistAsync per rule kind.");

    
    /// <summary>Billing checkout attempts (labels: <c>provider</c>, <c>tier</c>, <c>outcome</c>).</summary>
    public static readonly Counter<long> BillingCheckoutsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_billing_checkouts_total",
            description: "Billing checkout sessions (labels: provider, tier, outcome).");

    
    /// <summary>Wall time for <c>IArchLucidJob.RunOnceAsync</c> (labels: <c>job_name</c>, <c>exit_code</c>).</summary>
    public static readonly Histogram<double> ContainerJobRunDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_container_job_run_duration_ms",
            "ms",
            "Duration of one-shot background jobs (labels: job_name, exit_code).");

    
    /// <summary><c>ArchLucid.Jobs.Cli</c> / <c>IArchLucidJob</c> executions (labels: <c>job_name</c>, <c>exit_class</c>).</summary>
    public static readonly Counter<long> ContainerJobRunsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_container_job_runs_total",
            description:
            "ArchLucid.Jobs.Cli job runs (labels: job_name, exit_class=success|failure|unknown_job|configuration_error|canceled).");

    
    /// <summary>Orphaned agent-trace blobs deleted by archival cleanup.</summary>
    public static readonly Counter<long> DataArchivalBlobsDeletedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_data_archival_blobs_deleted_total",
            description: "Agent trace blobs deleted because the authority run no longer exists.");

    
    /// <summary>Environment-graded alert when orphan count meets threshold (labels <c>table</c>, <c>column</c>).</summary>
    public static readonly Counter<long> DataConsistencyAlerts =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_alerts_total",
            description: "Data consistency enforcement alert increments (labels table, column).");

    
    /// <summary>
    ///     Committed run header pointer violations (labels <c>pointer</c> — e.g. ContextSnapshotId).
    /// </summary>
    public static readonly Counter<long> DataConsistencyHeaderRepointsDetected =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_header_repoints_detected_total",
            description:
            "Committed dbo.Runs evidence pointers referencing missing or cross-run child rows (label pointer).");

    
    /// <summary>Rows detected by consistency probes referencing missing authority state (labels <c>table</c>, <c>column</c>).</summary>
    public static readonly Counter<long> DataConsistencyOrphansDetected =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_orphans_detected_total",
            description: "Orphan authority-chain rows detected (labels table, column; e.g. GoldenManifests.RunId).");

    
    /// <summary>Rows inserted into <c>dbo.DataConsistencyQuarantine</c> from orphan probes (labels <c>table</c>, <c>column</c>).</summary>
    public static readonly Counter<long> DataConsistencyOrphansQuarantined =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_orphans_quarantined_total",
            description:
            "Orphan rows quarantined (inserted into dbo.DataConsistencyQuarantine; labels table, column).");

    
    /// <summary>Wall time for scheduled read-only data consistency reconciliation (full pass).</summary>
    public static readonly Histogram<double> DataConsistencyReconciliationDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_data_consistency_check_duration_ms",
            "ms",
            "Wall time for scheduled data consistency reconciliation (read-only checks).");

    
    /// <summary>Findings emitted during data consistency reconciliation (labels <c>severity</c>, <c>check_name</c>).</summary>
    public static readonly Counter<long> DataConsistencyReconciliationFindingsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_findings_total",
            description: "Data consistency reconciliation findings (labels severity, check_name).");

    
    /// <summary>Sponsor ROI background jobs skipped a tenant because tenant/workspace/project scope failed validation (fail-closed).</summary>
    public static readonly Counter<long> SponsorRoiBackgroundScopeViolationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_executive_roi_background_scope_violations_total",
            description: "Leader-elected Sponsor ROI cache warmup / savings gauge skipped a tenant due to invalid ambient scope (labels reason).");

    
    /// <summary>
    ///     Per advisory scan: fraction of explainability trace fields populated across findings (0.0–1.0; label
    ///     <c>scan_type</c>).
    /// </summary>
    public static readonly Histogram<double> ExplainabilityTraceCompleteness = AppMeter.CreateHistogram<double>(
        "archlucid_explainability_trace_completeness_ratio",
        description: "Per-scan trace completeness ratio (0.0–1.0).");

    
    /// <summary>Wall time for effective governance resolution (<c>IEffectiveGovernanceResolver.ResolveAsync</c>).</summary>
    public static readonly Histogram<double> GovernanceResolveDurationMilliseconds = AppMeter.CreateHistogram<double>(
        "archlucid_governance_resolve_duration_ms",
        "ms",
        "Time to resolve effective governance for a tenant/workspace/project scope.");

    
    /// <summary>Provenance graph served from a fresh persisted snapshot (revision hash match).</summary>
    public static readonly Counter<long> ProvenanceSnapshotReadHitsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_provenance_snapshot_read_hits_total",
            description: "Provenance reads satisfied from persisted snapshot without rebuild.");

    
    /// <summary>Provenance graph rebuilt because snapshot missing or revision stale.</summary>
    public static readonly Counter<long> ProvenanceSnapshotRebuildFallbackTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_provenance_snapshot_rebuild_fallback_total",
            description: "Provenance reads that rebuilt the graph (missing or stale snapshot).");

    
    /// <summary>Decision provenance snapshots persisted (TB-037).</summary>
    public static readonly Counter<long> ProvenanceSnapshotWritesTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_provenance_snapshot_writes_total",
            description: "Decision provenance snapshots upserted after commit or rebuild.");

    
    /// <summary>
    ///     Observed latency for named SQL/query gates (TECH_BACKLOG TB-003 parity with CI allowlist; label <c>query_name</c>).
    /// </summary>
    public static readonly Histogram<double> QueryNamedLatencyMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_query_p95_ms",
            "ms",
            "Latency snapshot for named query performance regression gates (label query_name).");

    
    /// <summary>
    ///     Startup configuration advisory warnings (label <c>rule_name</c>) — bounded code constants only (TECH_BACKLOG TB-002).
    /// </summary>
    public static readonly Counter<long> StartupConfigWarningsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_startup_config_warnings_total",
            description: "Non-fatal startup configuration warnings (label rule_name).");

    
    /// <summary>Incremented when host shutdown times out while drain is still active (TB-961).</summary>
    public static readonly Counter<long> WorkerDrainForcedKillTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_worker_drain_forced_kill_total",
            description: "Host shutdown timed out during drain; platform may force-kill the replica (TB-961).");

    
    /// <summary>Shutdown execute-ownership lease release latency in milliseconds (TB-961).</summary>
    public static readonly Histogram<double> WorkerDrainLeaseReleaseDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_worker_drain_lease_release_duration_ms",
            "ms",
            "Duration to release execute ownership leases held by this instance during shutdown drain (TB-961).");

    
    /// <summary>Incremented once per replica when <c>ApplicationStopping</c> begins cooperative drain (TB-961).</summary>
    public static readonly Counter<long> WorkerDrainStartedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_worker_drain_started_total",
            description: "Worker/API host drain started on ApplicationStopping (TB-961).");

    /// <summary>Records one provenance snapshot upsert.</summary>
    public static void RecordProvenanceSnapshotWrite()
    {
        ProvenanceSnapshotWritesTotal.Add(1);
    }

    /// <summary>Records one provenance read satisfied from a fresh snapshot.</summary>
    public static void RecordProvenanceSnapshotReadHit()
    {
        ProvenanceSnapshotReadHitsTotal.Add(1);
    }

    /// <summary>Records one provenance read that rebuilt the graph.</summary>
    public static void RecordProvenanceSnapshotRebuildFallback()
    {
        ProvenanceSnapshotRebuildFallbackTotal.Add(1);
    }

    /// <summary>
    ///     Increments <see cref="StartupConfigWarningsTotal"/> once per distinct advisory emission (TECH_BACKLOG TB-002).
    /// </summary>
    public static void RecordStartupConfigWarning(string ruleName)
    {
        string r = string.IsNullOrWhiteSpace(ruleName) ? "unknown" : ruleName.Trim();
        StartupConfigWarningsTotal.Add(1, new TagList { { "rule_name", r } });
    }

    /// <summary>Records a latency observation for TB-003 allowlisted queries (production or CI ingest).</summary>
    public static void RecordNamedQueryLatencyMilliseconds(string queryName, double milliseconds)
    {
        string q = string.IsNullOrWhiteSpace(queryName) ? "unknown" : queryName.Trim();
        QueryNamedLatencyMilliseconds.Record(milliseconds, new TagList { { "query_name", q } });
    }

    /// <summary>Increments <see cref="BillingCheckoutsTotal" />.</summary>
    public static void RecordBillingCheckout(string provider, string tier, string outcome)
    {
        TagList tags = new()
        {
            { "provider", string.IsNullOrWhiteSpace(provider) ? "unknown" : provider.Trim() },
            { "tier", string.IsNullOrWhiteSpace(tier) ? "unknown" : tier.Trim() },
            { "outcome", string.IsNullOrWhiteSpace(outcome) ? "unknown" : outcome.Trim() }
        };

        BillingCheckoutsTotal.Add(1, tags);
    }
}
