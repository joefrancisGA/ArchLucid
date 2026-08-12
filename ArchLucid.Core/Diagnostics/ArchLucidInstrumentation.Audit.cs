using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Durable audit trail telemetry: write failures, required abandons, and orphan-probe alerts.</summary>
/// <remarks>
///     Instrument field declarations for this subsystem live in this partial.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    // Instrument catalog

    
    /// <summary>
    ///     Audit events dropped because the in-memory retry queue was full (hot-path enqueue or requeue after drain
    ///     failure).
    /// </summary>
    public static readonly Counter<long> AuditRetryEnqueueDroppedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_audit_retry_enqueue_dropped_total",
            description: "Audit retry queue dropped events because the bounded channel was full.");

    
    /// <summary>
    ///     Durable SQL audit writes abandoned after <see cref="ArchLucid.Core.Audit.DurableAuditLogRetry.TryLogAsync" />
    ///     exhausted retries (label <c>event_type</c>).
    /// </summary>
    public static readonly Counter<long> AuditWriteFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_audit_write_failures_total",
            description: "Durable audit writes abandoned after max retries (label event_type).");

    
    /// <summary>
    ///     Pageable-equivalent increment when Required audit trail orphan counts are above zero
    ///     (label <c>domain</c>).
    /// </summary>
    public static readonly Counter<long> RequiredAuditTrailOrphanAlertsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_required_audit_trail_orphan_alerts_total",
            description: "Required audit trail orphan probe alert increments (label domain).");

    
    /// <summary>
    ///     Domain rows missing expected Required audit events within the orphan-probe grace window
    ///     (label <c>domain</c>: governance_approved, governance_rejected, golden_manifest_finalized).
    /// </summary>
    public static readonly Counter<long> RequiredAuditTrailOrphansDetectedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_required_audit_trail_orphans_detected_total",
            description: "Required audit trail orphan probe detections (label domain).");

    
    /// <summary>
    ///     Required (fail-closed) audit writes abandoned after
    ///     <see cref="ArchLucid.Core.Audit.DurableAuditLogRetry.LogOrThrowAsync" /> retries (label <c>event_type</c>).
    ///     Pageable via Prometheus <c>ArchLucidRequiredAuditWriteAbandon</c> — never incremented on informational
    ///     <see cref="ArchLucid.Core.Audit.DurableAuditLogRetry.TryLogAsync" /> (TB-955 / INV-003).
    /// </summary>
    public static readonly Counter<long> RequiredAuditWriteAbandonsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_required_audit_write_abandons_total",
            description: "Required durable audit writes abandoned after LogOrThrow retries (label event_type).");

    /// <summary>Increments <see cref="AuditWriteFailuresTotal" /> (label <c>event_type</c>).</summary>
    public static void RecordAuditWriteFailure(string eventType)
    {
        string e = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim();
        AuditWriteFailuresTotal.Add(1, new TagList { { "event_type", e } });
    }

    /// <summary>
    ///     Increments <see cref="RequiredAuditWriteAbandonsTotal" /> for fail-closed Required audit abandons only.
    /// </summary>
    public static void RecordRequiredAuditWriteAbandon(string? eventType)
    {
        string e = string.IsNullOrWhiteSpace(eventType) ? "unspecified" : eventType.Trim();
        RequiredAuditWriteAbandonsTotal.Add(1, new TagList { { "event_type", e } });
    }

    /// <summary>Increments orphan detection + alert counters for a Required audit trail domain slice.</summary>
    public static void RecordRequiredAuditTrailOrphan(string domain, long orphanCount)
    {
        string d = string.IsNullOrWhiteSpace(domain) ? "unknown" : domain.Trim();

        RequiredAuditTrailOrphansDetectedTotal.Add(
            orphanCount < 0 ? 0 : orphanCount,
            new TagList { { "domain", d } });

        if (orphanCount <= 0)
            return;

        RequiredAuditTrailOrphanAlertsTotal.Add(1, new TagList { { "domain", d } });
    }
}
