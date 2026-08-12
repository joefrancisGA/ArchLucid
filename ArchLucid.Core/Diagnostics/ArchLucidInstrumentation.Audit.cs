using System.Diagnostics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Durable audit trail telemetry: write failures, required abandons, and orphan-probe alerts.</summary>
/// <remarks>
///     Instrument field declarations remain in <c>ArchLucidInstrumentation.cs</c>.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
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
