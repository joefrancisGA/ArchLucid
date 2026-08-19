namespace ArchLucid.Persistence.Coordination.Diagnostics;

/// <summary>Fleet-wide stale in-flight run snapshot for Prometheus gauges + log triage (TB-958).</summary>
public sealed class StaleInFlightRunMetricsSnapshot
{
    public long StaleInFlightCount
    {
        get;
        init;
    }

    public double OldestStaleAgeSeconds
    {
        get;
        init;
    }

    /// <summary>Oldest samples for structured-log triage (never used as Prom labels).</summary>
    public IReadOnlyList<StaleInFlightRunTriageSample> TriageSamples
    {
        get;
        init;
    } = Array.Empty<StaleInFlightRunTriageSample>();
}
