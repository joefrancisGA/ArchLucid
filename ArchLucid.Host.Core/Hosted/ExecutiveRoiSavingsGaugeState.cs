using System.Diagnostics.Metrics;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Latest executive ROI savings gauge snapshots (read on Prometheus scrape).</summary>
public sealed class ExecutiveRoiSavingsGaugeState
{
    private readonly Lock _gate = new();

    private Measurement<double>[] _measurements = [];

    public Measurement<double>[] SnapshotMeasurements()
    {
        lock (_gate)
            return _measurements;
    }

    public void PublishMeasurements(Measurement<double>[] measurements)
    {
        Measurement<double>[] next = measurements ?? [];

        lock (_gate)
            _measurements = next;
    }
}
