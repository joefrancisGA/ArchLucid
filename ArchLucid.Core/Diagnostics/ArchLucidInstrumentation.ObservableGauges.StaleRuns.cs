using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidInstrumentation
{
    private static int _staleInFlightRunObservableGaugesRegistered;

    /// <summary>Latest fleet-wide stale in-flight run gauges for <see cref="EnsureStaleInFlightRunObservableGaugesRegistered" /> (TB-958).</summary>
    public static StaleInFlightRunGaugeState StaleInFlightRunGauges
    {
        get;
    } = new();

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
}
