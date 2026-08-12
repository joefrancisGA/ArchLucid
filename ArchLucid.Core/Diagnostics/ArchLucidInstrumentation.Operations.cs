using System.Diagnostics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Platform operations telemetry: startup config advisories, named-query latency gates, billing checkout, and
///     provenance snapshot counters.
/// </summary>
/// <remarks>
///     Instrument field declarations remain in <c>ArchLucidInstrumentation.cs</c>.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
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
